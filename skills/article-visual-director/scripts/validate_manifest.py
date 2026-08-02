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
VALID_INTEGRATION_STATES = {"pending", "complete", "failed"}
VALID_VERIFICATION_STATES = {"pending", "passed", "failed"}
VALID_OUTPUT_FORMATS = {"png", "jpg", "jpeg", "svg"}
ROLE_RENDERER = {
    "cover": "imagegen",
    "concept": "imagegen",
    "process": "deterministic-diagram",
    "architecture": "deterministic-diagram",
    "comparison": "deterministic-diagram",
    "timeline": "deterministic-diagram",
    "chart": "deterministic-chart",
}
WINDOWS_RESERVED_NAMES = {
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
}

SHA256_RE = re.compile(r"^[0-9a-fA-F]{64}$")
SAFE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ASPECT_RATIO_RE = re.compile(r"^[1-9]\d*(?:\.\d+)?:[1-9]\d*(?:\.\d+)?$")


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
    if any(ord(character) < 32 for character in normalized) or ":" in normalized:
        return False
    candidate = PurePosixPath(normalized)
    if candidate.is_absolute() or ".." in candidate.parts or normalized == ".":
        return False
    for part in candidate.parts:
        if part in {"", "."} or part.endswith((" ", ".")):
            return False
        if part.split(".", 1)[0].upper() in WINDOWS_RESERVED_NAMES:
            return False
    return True


def _relative_is_under(value: str, directory: str) -> bool:
    candidate = PurePosixPath(value.replace("\\", "/"))
    root = PurePosixPath(directory.replace("\\", "/"))
    try:
        candidate.relative_to(root)
    except ValueError:
        return False
    return candidate != root


def _resolved_is_under(path: Path, root: Path) -> bool:
    try:
        path.resolve().relative_to(root.resolve())
    except ValueError:
        return False
    return True


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
            "source.path must be a platform-safe relative path",
        )
    elif Path(source["path"]).suffix.lower() != ".md":
        _add_error(
            errors,
            "invalid_source_format",
            "source.path",
            "source.path must name a Markdown file",
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
            errors, "invalid_platforms", "platforms", "platforms must be non-empty"
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

    outputs = _require_mapping(data, "outputs", errors, "outputs")
    for field in ("illustrated_markdown", "asset_directory"):
        if not _is_safe_relative_path(outputs.get(field)):
            _add_error(
                errors,
                "unsafe_relative_path",
                f"outputs.{field}",
                f"outputs.{field} must be a platform-safe relative path",
            )
    illustrated = outputs.get("illustrated_markdown")
    if _is_safe_relative_path(illustrated) and Path(illustrated).suffix.lower() != ".md":
        _add_error(
            errors,
            "invalid_output_format",
            "outputs.illustrated_markdown",
            "illustrated_markdown must name a Markdown file",
        )
    source = data.get("source")
    if isinstance(source, dict) and illustrated == source.get("path"):
        _add_error(
            errors,
            "source_output_collision",
            "outputs.illustrated_markdown",
            "the default illustrated output must differ from the source",
        )
    actual_illustrated = outputs.get("actual_illustrated_markdown")
    if actual_illustrated is not None:
        if not _is_safe_relative_path(actual_illustrated):
            _add_error(
                errors,
                "unsafe_relative_path",
                "outputs.actual_illustrated_markdown",
                "actual_illustrated_markdown must be null or a platform-safe relative path",
            )
        elif Path(actual_illustrated).suffix.lower() != ".md":
            _add_error(
                errors,
                "invalid_output_format",
                "outputs.actual_illustrated_markdown",
                "actual_illustrated_markdown must name a Markdown file",
            )
        elif isinstance(source, dict) and actual_illustrated == source.get("path"):
            _add_error(
                errors,
                "source_output_collision",
                "outputs.actual_illustrated_markdown",
                "recorded illustrated output must differ from the source",
            )
    expected_asset_directory = f"assets/{article_slug}" if isinstance(article_slug, str) else None
    if (
        expected_asset_directory
        and outputs.get("asset_directory") != expected_asset_directory
    ):
        _add_error(
            errors,
            "invalid_asset_directory",
            "outputs.asset_directory",
            f"asset_directory must be {expected_asset_directory!r}",
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

    integration = _require_mapping(data, "integration", errors, "integration")
    if integration.get("status") not in VALID_INTEGRATION_STATES:
        _add_error(
            errors,
            "invalid_status",
            "integration.status",
            f"integration.status must be one of {sorted(VALID_INTEGRATION_STATES)}",
        )
    if integration.get("verification_status") not in VALID_VERIFICATION_STATES:
        _add_error(
            errors,
            "invalid_status",
            "integration.verification_status",
            "integration.verification_status must be pending, passed, or failed",
        )


def _validate_dimensions(
    dimensions: Any, base: str, errors: list[dict[str, str]]
) -> None:
    if not isinstance(dimensions, dict):
        _add_error(
            errors,
            "invalid_dimensions",
            f"{base}.dimensions",
            "dimensions must be an object with positive width and height",
        )
        return
    for field in ("width", "height"):
        value = dimensions.get(field)
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            _add_error(
                errors,
                "invalid_dimensions",
                f"{base}.dimensions.{field}",
                f"dimensions.{field} must be a positive integer",
            )


def _validate_asset(
    asset: Any,
    index: int,
    manifest_path: Path,
    phase: str,
    asset_directory: str | None,
    errors: list[dict[str, str]],
) -> tuple[str | None, str | None]:
    base = f"assets[{index}]"
    if not isinstance(asset, dict):
        _add_error(errors, "invalid_asset", base, "asset must be an object")
        return None, None

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

    for field in ("reader_takeaway", "visual_purpose", "safe_area"):
        if not _is_nonempty_string(asset.get(field)):
            _add_error(
                errors,
                "missing_asset_field",
                f"{base}.{field}",
                f"{field} must be a non-empty string",
            )

    role = asset.get("role")
    renderer = asset.get("renderer")
    if role not in VALID_ROLES:
        _add_error(
            errors,
            "invalid_role",
            f"{base}.role",
            f"role must be one of {sorted(VALID_ROLES)}",
        )
    if renderer not in VALID_RENDERERS:
        _add_error(
            errors,
            "invalid_renderer",
            f"{base}.renderer",
            f"renderer must be one of {sorted(VALID_RENDERERS)}",
        )
    elif role in ROLE_RENDERER and renderer != ROLE_RENDERER[role]:
        _add_error(
            errors,
            "renderer_role_mismatch",
            f"{base}.renderer",
            f"role {role!r} requires renderer {ROLE_RENDERER[role]!r}",
        )

    output_format = asset.get("output_format")
    if output_format not in VALID_OUTPUT_FORMATS:
        _add_error(
            errors,
            "invalid_output_format",
            f"{base}.output_format",
            f"output_format must be one of {sorted(VALID_OUTPUT_FORMATS)}",
        )
    _validate_dimensions(asset.get("dimensions"), base, errors)
    aspect_ratio = asset.get("aspect_ratio")
    if not isinstance(aspect_ratio, str) or not ASPECT_RATIO_RE.fullmatch(aspect_ratio):
        _add_error(
            errors,
            "invalid_aspect_ratio",
            f"{base}.aspect_ratio",
            "aspect_ratio must use width:height numeric notation",
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
    if renderer in {"deterministic-diagram", "deterministic-chart"}:
        diagram_spec = asset.get("diagram_spec")
        if not isinstance(diagram_spec, dict):
            _add_error(
                errors,
                "missing_diagram_spec",
                f"{base}.diagram_spec",
                "deterministic assets require a structured diagram_spec",
            )
        else:
            for field in ("nodes", "edges", "blocked_unconfirmed_edges"):
                if not isinstance(diagram_spec.get(field), list):
                    _add_error(
                        errors,
                        "invalid_diagram_spec",
                        f"{base}.diagram_spec.{field}",
                        f"diagram_spec.{field} must be an array",
                    )
        editable_source = asset.get("editable_source_path")
        if not _is_safe_relative_path(editable_source):
            _add_error(
                errors,
                "missing_editable_source",
                f"{base}.editable_source_path",
                "deterministic assets require a platform-safe editable source path",
            )
    elif asset.get("editable_source_path") is not None and not _is_safe_relative_path(
        asset.get("editable_source_path")
    ):
        _add_error(
            errors,
            "unsafe_relative_path",
            f"{base}.editable_source_path",
            "editable_source_path must be null or a platform-safe relative path",
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
                f"{field} must be a platform-safe relative path",
            )
    artifact_path = asset.get("artifact_path")
    if (
        _is_safe_relative_path(artifact_path)
        and output_format in VALID_OUTPUT_FORMATS
        and Path(artifact_path).suffix.lower() != f".{output_format}"
    ):
        _add_error(
            errors,
            "artifact_format_mismatch",
            f"{base}.artifact_path",
            "artifact extension must match output_format",
        )
    markdown_path = asset.get("markdown_path")
    if (
        _is_safe_relative_path(markdown_path)
        and asset_directory
        and not _relative_is_under(markdown_path, asset_directory)
    ):
        _add_error(
            errors,
            "markdown_path_outside_asset_directory",
            f"{base}.markdown_path",
            "markdown_path must be inside outputs.asset_directory",
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
        manifest_root = manifest_path.parent.resolve()
        if _is_safe_relative_path(artifact_path):
            absolute_artifact = (manifest_root / artifact_path).resolve()
            if not _resolved_is_under(absolute_artifact, manifest_root):
                _add_error(
                    errors,
                    "artifact_path_escape",
                    f"{base}.artifact_path",
                    "resolved artifact path escapes the manifest directory",
                )
            elif not absolute_artifact.is_file():
                _add_error(
                    errors,
                    "artifact_missing",
                    f"{base}.artifact_path",
                    f"artifact does not exist: {artifact_path}",
                )
        editable_source = asset.get("editable_source_path")
        if renderer in {"deterministic-diagram", "deterministic-chart"} and _is_safe_relative_path(
            editable_source
        ):
            absolute_source = (manifest_root / editable_source).resolve()
            if not _resolved_is_under(absolute_source, manifest_root):
                _add_error(
                    errors,
                    "editable_source_escape",
                    f"{base}.editable_source_path",
                    "resolved editable source escapes the manifest directory",
                )
            elif not absolute_source.is_file():
                _add_error(
                    errors,
                    "editable_source_missing",
                    f"{base}.editable_source_path",
                    f"editable source does not exist: {editable_source}",
                )
    return normalized_id, markdown_path if _is_safe_relative_path(markdown_path) else None


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
    if phase == "integration":
        manifest_root = manifest_path.parent.resolve()
        source = data.get("source")
        source_value = source.get("path") if isinstance(source, dict) else None
        if _is_safe_relative_path(source_value):
            resolved_source = (manifest_root / source_value).resolve()
            if not _resolved_is_under(resolved_source, manifest_root):
                _add_error(
                    errors,
                    "source_path_escape",
                    "source.path",
                    "resolved source path escapes the manifest directory",
                )
        outputs = data.get("outputs")
        output_value = (
            outputs.get("illustrated_markdown")
            if isinstance(outputs, dict)
            else None
        )
        if _is_safe_relative_path(output_value):
            resolved_output = (manifest_root / output_value).resolve()
            if not _resolved_is_under(resolved_output, manifest_root):
                _add_error(
                    errors,
                    "output_path_escape",
                    "outputs.illustrated_markdown",
                    "resolved output path escapes the manifest directory",
                )
        actual_output_value = (
            outputs.get("actual_illustrated_markdown")
            if isinstance(outputs, dict)
            else None
        )
        if _is_safe_relative_path(actual_output_value):
            resolved_actual_output = (manifest_root / actual_output_value).resolve()
            if not _resolved_is_under(resolved_actual_output, manifest_root):
                _add_error(
                    errors,
                    "output_path_escape",
                    "outputs.actual_illustrated_markdown",
                    "resolved actual output path escapes the manifest directory",
                )
    assets = data.get("assets")
    if not isinstance(assets, list) or not assets:
        _add_error(
            errors, "invalid_assets", "assets", "assets must be a non-empty array"
        )
        return errors

    outputs = data.get("outputs")
    asset_directory = (
        outputs.get("asset_directory") if isinstance(outputs, dict) else None
    )
    asset_ids: set[str] = set()
    markdown_paths: set[str] = set()
    raster_count = 0
    for index, asset in enumerate(assets):
        asset_id, markdown_path = _validate_asset(
            asset, index, manifest_path, phase, asset_directory, errors
        )
        if asset_id in asset_ids:
            _add_error(
                errors,
                "duplicate_asset_id",
                f"assets[{index}].id",
                f"asset id is duplicated: {asset_id}",
            )
        elif asset_id is not None:
            asset_ids.add(asset_id)
        if markdown_path in markdown_paths:
            _add_error(
                errors,
                "duplicate_markdown_path",
                f"assets[{index}].markdown_path",
                f"markdown path is duplicated: {markdown_path}",
            )
        elif markdown_path is not None:
            markdown_paths.add(markdown_path)
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
    result = {
        "overall": "passed" if not errors else "failed",
        "phase": args.phase,
        "errors": errors,
    }
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
