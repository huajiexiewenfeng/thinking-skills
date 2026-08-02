#!/usr/bin/env python3
"""Validate an article visual manifest with no third-party dependencies."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path, PurePosixPath
from typing import Any


VALID_PLATFORMS = {"csdn", "wechat"}
VALID_RENDERERS = {"imagegen", "deterministic-diagram", "deterministic-chart"}
VALID_ROLES = {
    "cover",
    "concept",
    "process",
    "architecture",
    "comparison",
    "timeline",
    "chart",
}
VALID_PLACEMENTS = {"after_heading", "section_end"}
VALID_APPROVALS = {"approved", "pending", "rejected", "not_required"}
VALID_GENERATION_STATES = {"planned", "pending", "complete", "failed"}
VALID_VALIDATION_STATES = {"planned", "pending", "passed", "failed"}
VALID_INSERTION_STATES = {"pending", "inserted", "skipped"}

SHA256_RE = re.compile(r"^[0-9a-fA-F]{64}$")
SAFE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def load_manifest(path: Path) -> dict[str, Any]:
    """Load a UTF-8 JSON manifest from disk."""
    with path.open("r", encoding="utf-8-sig") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("manifest root must be a JSON object")
    return data


def _add_error(
    errors: list[dict[str, str]], code: str, path: str, message: str
) -> None:
    errors.append({"code": code, "path": path, "message": message})


def _is_nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _is_sha256(value: Any) -> bool:
    return isinstance(value, str) and bool(SHA256_RE.fullmatch(value))


def _is_safe_relative_path(value: Any) -> bool:
    if not _is_nonempty_string(value):
        return False
    normalized = value.replace("\\", "/")
    candidate = PurePosixPath(normalized)
    return (
        not candidate.is_absolute()
        and not candidate.parts[0].endswith(":")
        and ".." not in candidate.parts
        and "." != normalized
    )


def _require_mapping(
    parent: dict[str, Any],
    key: str,
    errors: list[dict[str, str]],
    path: str,
) -> dict[str, Any]:
    value = parent.get(key)
    if not isinstance(value, dict):
        _add_error(errors, "invalid_object", path, f"{key} must be an object")
        return {}
    return value


def _validate_source(data: dict[str, Any], errors: list[dict[str, str]]) -> None:
    source = _require_mapping(data, "source", errors, "source")
    if not _is_safe_relative_path(source.get("path")):
        _add_error(
            errors,
            "unsafe_relative_path",
            "source.path",
            "source.path must be a safe relative path",
        )
    if not _is_sha256(source.get("sha256")):
        _add_error(
            errors,
            "invalid_sha256",
            "source.sha256",
            "source.sha256 must contain exactly 64 hexadecimal characters",
        )
    if source.get("encoding") not in {"utf-8", "utf-8-sig"}:
        _add_error(
            errors,
            "invalid_encoding",
            "source.encoding",
            "source.encoding must be utf-8 or utf-8-sig",
        )
    if source.get("line_ending") not in {"lf", "crlf"}:
        _add_error(
            errors,
            "invalid_line_ending",
            "source.line_ending",
            "source.line_ending must be lf or crlf",
        )


def _validate_top_level(data: dict[str, Any], errors: list[dict[str, str]]) -> None:
    if data.get("manifest_version") != 1:
        _add_error(
            errors,
            "unsupported_manifest_version",
            "manifest_version",
            "manifest_version must be 1",
        )
    _validate_source(data, errors)

    article_slug = data.get("article_slug")
    if not isinstance(article_slug, str) or not SAFE_ID_RE.fullmatch(article_slug):
        _add_error(
            errors,
            "invalid_article_slug",
            "article_slug",
            "article_slug must be lowercase kebab-case ASCII",
        )

    platforms = data.get("platforms")
    if not isinstance(platforms, list) or not platforms:
        _add_error(
            errors,
            "invalid_platforms",
            "platforms",
            "platforms must be a non-empty array",
        )
    else:
        for index, platform in enumerate(platforms):
            if platform not in VALID_PLATFORMS:
                _add_error(
                    errors,
                    "unsupported_platform",
                    f"platforms[{index}]",
                    f"platform must be one of {sorted(VALID_PLATFORMS)}",
                )
        if len(platforms) != len(set(platforms)):
            _add_error(
                errors,
                "duplicate_platform",
                "platforms",
                "platforms must not contain duplicates",
            )

    style = _require_mapping(data, "style", errors, "style")
    for field in ("profile_id", "fingerprint"):
        if not _is_nonempty_string(style.get(field)):
            _add_error(
                errors,
                "missing_style_field",
                f"style.{field}",
                f"style.{field} must be a non-empty string",
            )

    approvals = _require_mapping(data, "approvals", errors, "approvals")
    if approvals.get("plan") != "approved":
        _add_error(
            errors,
            "plan_not_approved",
            "approvals.plan",
            "the complete visual plan must be approved before execution",
        )
    if approvals.get("style_anchor") not in VALID_APPROVALS:
        _add_error(
            errors,
            "invalid_approval_state",
            "approvals.style_anchor",
            f"style_anchor must be one of {sorted(VALID_APPROVALS)}",
        )


def _validate_asset(
    asset: Any,
    index: int,
    manifest_path: Path,
    phase: str,
    errors: list[dict[str, str]],
) -> str | None:
    base = f"assets[{index}]"
    if not isinstance(asset, dict):
        _add_error(errors, "invalid_asset", base, "asset must be an object")
        return None

    asset_id = asset.get("id")
    if not isinstance(asset_id, str) or not SAFE_ID_RE.fullmatch(asset_id):
        _add_error(
            errors,
            "invalid_asset_id",
            f"{base}.id",
            "asset id must be lowercase kebab-case ASCII",
        )
        normalized_id = None
    else:
        normalized_id = asset_id

    if asset.get("role") not in VALID_ROLES:
        _add_error(
            errors,
            "invalid_role",
            f"{base}.role",
            f"role must be one of {sorted(VALID_ROLES)}",
        )
    renderer = asset.get("renderer")
    if renderer not in VALID_RENDERERS:
        _add_error(
            errors,
            "invalid_renderer",
            f"{base}.renderer",
            f"renderer must be one of {sorted(VALID_RENDERERS)}",
        )

    anchor = asset.get("anchor")
    if not isinstance(anchor, dict):
        _add_error(
            errors, "invalid_object", f"{base}.anchor", "anchor must be an object"
        )
        anchor = {}
    if not _is_nonempty_string(anchor.get("heading")):
        _add_error(
            errors,
            "missing_anchor_heading",
            f"{base}.anchor.heading",
            "anchor.heading must contain the exact Markdown heading",
        )
    occurrence = anchor.get("occurrence")
    if not isinstance(occurrence, int) or isinstance(occurrence, bool) or occurrence < 1:
        _add_error(
            errors,
            "invalid_anchor_occurrence",
            f"{base}.anchor.occurrence",
            "anchor.occurrence must be a positive integer",
        )
    if anchor.get("placement") not in VALID_PLACEMENTS:
        _add_error(
            errors,
            "invalid_anchor_placement",
            f"{base}.anchor.placement",
            f"placement must be one of {sorted(VALID_PLACEMENTS)}",
        )
    if not _is_sha256(anchor.get("context_sha256")):
        _add_error(
            errors,
            "invalid_sha256",
            f"{base}.anchor.context_sha256",
            "context_sha256 must contain exactly 64 hexadecimal characters",
        )

    if renderer == "imagegen" and not _is_nonempty_string(asset.get("prompt")):
        _add_error(
            errors,
            "missing_prompt",
            f"{base}.prompt",
            "imagegen assets require an approved prompt",
        )
    if renderer in {"deterministic-diagram", "deterministic-chart"} and not isinstance(
        asset.get("diagram_spec"), dict
    ):
        _add_error(
            errors,
            "missing_diagram_spec",
            f"{base}.diagram_spec",
            "deterministic assets require a structured diagram_spec",
        )
    if asset.get("approval") != "approved":
        _add_error(
            errors,
            "asset_not_approved",
            f"{base}.approval",
            "every asset must be approved before execution",
        )

    for field in ("artifact_path", "markdown_path"):
        if not _is_safe_relative_path(asset.get(field)):
            _add_error(
                errors,
                "unsafe_relative_path",
                f"{base}.{field}",
                f"{field} must be a safe relative path",
            )
    if not _is_nonempty_string(asset.get("alt")):
        _add_error(
            errors,
            "missing_alt_text",
            f"{base}.alt",
            "alt text must be a non-empty string",
        )
    if asset.get("caption") is not None and not isinstance(asset.get("caption"), str):
        _add_error(
            errors,
            "invalid_caption",
            f"{base}.caption",
            "caption must be a string or null",
        )

    state_checks = (
        ("generation_status", VALID_GENERATION_STATES),
        ("validation_status", VALID_VALIDATION_STATES),
        ("insertion_status", VALID_INSERTION_STATES),
    )
    for field, allowed in state_checks:
        if asset.get(field) not in allowed:
            _add_error(
                errors,
                "invalid_status",
                f"{base}.{field}",
                f"{field} must be one of {sorted(allowed)}",
            )

    if phase == "integration":
        if asset.get("generation_status") != "complete":
            _add_error(
                errors,
                "asset_not_generated",
                f"{base}.generation_status",
                "integration requires generation_status=complete",
            )
        if asset.get("validation_status") != "passed":
            _add_error(
                errors,
                "asset_not_validated",
                f"{base}.validation_status",
                "integration requires validation_status=passed",
            )
        artifact_path = asset.get("artifact_path")
        if _is_safe_relative_path(artifact_path):
            absolute_artifact = manifest_path.parent / Path(artifact_path)
            if not absolute_artifact.is_file():
                _add_error(
                    errors,
                    "artifact_missing",
                    f"{base}.artifact_path",
                    f"artifact does not exist: {artifact_path}",
                )
    return normalized_id


def validate_manifest(
    data: dict[str, Any], manifest_path: Path, phase: str
) -> list[dict[str, str]]:
    """Return structured validation errors; an empty list means valid."""
    errors: list[dict[str, str]] = []
    if phase not in {"plan", "integration"}:
        return [
            {
                "code": "invalid_phase",
                "path": "phase",
                "message": "phase must be plan or integration",
            }
        ]
    if not isinstance(data, dict):
        return [
            {
                "code": "invalid_manifest",
                "path": "$",
                "message": "manifest root must be an object",
            }
        ]

    _validate_top_level(data, errors)
    assets = data.get("assets")
    if not isinstance(assets, list) or not assets:
        _add_error(
            errors,
            "invalid_assets",
            "assets",
            "assets must be a non-empty array",
        )
        return errors

    asset_ids: set[str] = set()
    raster_count = 0
    for index, asset in enumerate(assets):
        asset_id = _validate_asset(asset, index, manifest_path, phase, errors)
        if asset_id in asset_ids:
            _add_error(
                errors,
                "duplicate_asset_id",
                f"assets[{index}].id",
                f"asset id is duplicated: {asset_id}",
            )
        elif asset_id is not None:
            asset_ids.add(asset_id)
        if isinstance(asset, dict) and asset.get("renderer") == "imagegen":
            raster_count += 1

    approvals = data.get("approvals")
    style_anchor = approvals.get("style_anchor") if isinstance(approvals, dict) else None
    if phase == "integration" and raster_count >= 3 and style_anchor != "approved":
        _add_error(
            errors,
            "style_anchor_not_approved",
            "approvals.style_anchor",
            "three or more imagegen assets require an approved style anchor",
        )
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--phase", choices=("plan", "integration"), required=True)
    args = parser.parse_args(argv)

    try:
        manifest = load_manifest(args.manifest)
        errors = validate_manifest(manifest, args.manifest, args.phase)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
        errors = [
            {
                "code": "manifest_load_failed",
                "path": str(args.manifest),
                "message": str(exc),
            }
        ]
    result = {"ok": not errors, "phase": args.phase, "errors": errors}
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
