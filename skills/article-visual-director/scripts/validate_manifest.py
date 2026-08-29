#!/usr/bin/env python3
"""Validate an article visual manifest with no third-party dependencies."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path, PurePosixPath
from typing import Any


VALID_PLATFORMS = {"csdn", "wechat", "x-article"}
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
VALID_COVER_TITLE_MODES = {"deterministic", "text-free"}
VALID_DRIFT_CODES = {
    "PROMPT_BLOCK_MISSING",
    "STYLE_IDENTITY_DRIFT",
    "ROLE_LAYOUT_DRIFT",
    "PUBLICATION_THEME_BLEED",
    "GOLDEN_CONTENT_COPY",
    "SEMANTIC_TOPOLOGY_DRIFT",
    "SERIES_CONTINUITY_DRIFT",
    "TEXT_POLICY_VIOLATION",
}
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


def _validate_top_level_v1(data: dict[str, Any], errors: list[dict[str, str]]) -> None:
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


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _resolve_skill_file(
    skill_root: Path,
    value: Any,
    field_path: str,
    errors: list[dict[str, str]],
) -> Path | None:
    if not _is_safe_relative_path(value):
        _add_error(
            errors,
            "unsafe_relative_path",
            field_path,
            f"{field_path} must be a platform-safe Skill-relative path",
        )
        return None
    target = (skill_root / value).resolve()
    if not _resolved_is_under(target, skill_root):
        _add_error(
            errors,
            "style_contract_path_escape",
            field_path,
            "Style contract path escapes the Skill root",
        )
        return None
    if not target.is_file():
        _add_error(
            errors,
            "style_contract_missing",
            field_path,
            f"Style contract file does not exist: {value}",
        )
        return None
    return target


def _validate_style_v2(
    data: dict[str, Any], skill_root: Path, errors: list[dict[str, str]]
) -> bool:
    style = _require_mapping(data, "style", errors, "style")
    required_strings = (
        "profile_id",
        "protocol_path",
        "protocol_sha256",
        "golden_set_path",
        "golden_set_sha256",
        "publication_theme",
        "theme_override_policy",
    )
    for field in required_strings:
        if not _is_nonempty_string(style.get(field)):
            _add_error(
                errors,
                "missing_style_field",
                f"style.{field}",
                f"style.{field} must be a non-empty string",
            )
    if not isinstance(style.get("profile_version"), int) or isinstance(
        style.get("profile_version"), bool
    ):
        _add_error(
            errors,
            "protocol_version_mismatch",
            "style.profile_version",
            "profile_version must be an integer matching the selected protocol",
        )
    for field in ("protocol_sha256", "golden_set_sha256"):
        if not _is_sha256(style.get(field)):
            _add_error(
                errors,
                "invalid_sha256",
                f"style.{field}",
                f"style.{field} must contain 64 hexadecimal characters",
            )

    golden_ids = style.get("golden_reference_ids")
    if (
        not isinstance(golden_ids, list)
        or len(golden_ids) != 3
        or len(set(golden_ids)) != 3
        or any(not _is_nonempty_string(item) for item in golden_ids)
    ):
        _add_error(
            errors,
            "invalid_golden_references",
            "style.golden_reference_ids",
            "golden_reference_ids must contain three unique approved IDs",
        )

    overrides = style.get("approved_overrides")
    if not isinstance(overrides, list):
        _add_error(
            errors,
            "theme_override_not_allowed",
            "style.approved_overrides",
            "approved_overrides must be an array",
        )
    elif style.get("theme_override_policy") == "title-layer-only":
        for index, override in enumerate(overrides):
            if not isinstance(override, str) or not override.startswith("title."):
                _add_error(
                    errors,
                    "theme_override_not_allowed",
                    f"style.approved_overrides[{index}]",
                    "Publication theme may override deterministic title-layer fields only",
                )
    elif overrides:
        _add_error(
            errors,
            "theme_override_not_allowed",
            "style.approved_overrides",
            "Selected theme policy does not allow overrides",
        )

    references = style.get("article_reference_paths")
    if not isinstance(references, list) or any(
        not _is_safe_relative_path(item) for item in references
    ):
        _add_error(
            errors,
            "invalid_article_references",
            "style.article_reference_paths",
            "article_reference_paths must be an array of safe relative paths",
        )

    contract_drift = False
    protocol = _resolve_skill_file(
        skill_root, style.get("protocol_path"), "style.protocol_path", errors
    )
    if protocol is not None and _is_sha256(style.get("protocol_sha256")):
        if _sha256_file(protocol) != style["protocol_sha256"].lower():
            contract_drift = True
            _add_error(
                errors,
                "protocol_hash_mismatch",
                "style.protocol_sha256",
                "Selected protocol changed after plan approval",
            )
    golden_path = _resolve_skill_file(
        skill_root, style.get("golden_set_path"), "style.golden_set_path", errors
    )
    if golden_path is not None and _is_sha256(style.get("golden_set_sha256")):
        if _sha256_file(golden_path) != style["golden_set_sha256"].lower():
            contract_drift = True
            _add_error(
                errors,
                "golden_set_hash_mismatch",
                "style.golden_set_sha256",
                "Selected golden set changed after plan approval",
            )
        try:
            golden = load_manifest(golden_path)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            _add_error(
                errors,
                "golden_set_invalid",
                "style.golden_set_path",
                str(exc),
            )
        else:
            if golden.get("status") != "approved":
                _add_error(
                    errors,
                    "golden_set_not_approved",
                    "style.golden_set_path",
                    "Manifest v2 requires an approved golden set",
                )
            if (
                golden.get("profile_id") != style.get("profile_id")
                or golden.get("protocol_version") != style.get("profile_version")
            ):
                _add_error(
                    errors,
                    "protocol_version_mismatch",
                    "style.profile_version",
                    "Profile identity/version must match the approved golden set",
                )
            actual_ids = {
                asset.get("id")
                for asset in golden.get("assets", [])
                if isinstance(asset, dict)
            }
            if isinstance(golden_ids, list) and set(golden_ids) != actual_ids:
                _add_error(
                    errors,
                    "invalid_golden_references",
                    "style.golden_reference_ids",
                    "Manifest references must match the approved golden-set asset IDs",
                )
    return contract_drift


def _validate_trace_file(
    *,
    errors: list[dict[str, str]],
    style: dict[str, Any],
    field: str,
    hash_field: str,
    root: Path,
    root_label: str,
) -> None:
    value = style.get(field)
    field_path = f"style.{field}"
    if not _is_safe_relative_path(value):
        _add_error(
            errors,
            "unsafe_relative_path",
            field_path,
            f"{field_path} must be a safe {root_label}-relative path",
        )
        return
    target = (root / value).resolve()
    if not _resolved_is_under(target, root):
        _add_error(
            errors,
            "style_contract_path_escape",
            field_path,
            f"{field_path} escapes the {root_label} root",
        )
        return
    if not target.is_file():
        _add_error(
            errors,
            "style_contract_missing",
            field_path,
            f"Traceability file does not exist: {value}",
        )
        return
    expected = style.get(hash_field)
    if _is_sha256(expected) and _sha256_file(target) != expected.lower():
        code = (
            "prompt_trace_hash_mismatch"
            if field in {"prompt_ir_path", "compiled_prompt_path"}
            else "style_pack_hash_mismatch"
        )
        _add_error(
            errors,
            code,
            f"style.{hash_field}",
            f"Traceability hash drift detected for {value}",
        )


def _validate_style_pack_v3_manifest(
    data: dict[str, Any],
    skill_root: Path,
    manifest_path: Path,
    errors: list[dict[str, str]],
) -> None:
    style = data.get("style")
    if not isinstance(style, dict):
        return
    style_pack_version = style.get("style_pack_version")
    if style_pack_version is None:
        return
    if style_pack_version != 3:
        _add_error(
            errors,
            "unsupported_style_pack_version",
            "style.style_pack_version",
            "style_pack_version must be 3 when the v3 extension is present",
        )
        return

    path_hash_pairs = (
        ("visual_dna_path", "visual_dna_sha256"),
        ("role_contracts_path", "role_contracts_sha256"),
        ("reference_matrix_path", "reference_matrix_sha256"),
        ("prompt_ir_path", "prompt_ir_sha256"),
        ("compiled_prompt_path", "compiled_prompt_sha256"),
    )
    required_fields = {
        field for pair in path_hash_pairs for field in pair
    } | {"adapter_id", "adapter_version"}
    for field in sorted(required_fields):
        if style.get(field) in (None, ""):
            _add_error(
                errors,
                "missing_style_pack_field",
                f"style.{field}",
                f"Style Pack v3 requires style.{field}",
            )

    for _, hash_field in path_hash_pairs:
        value = style.get(hash_field)
        if value is not None and not _is_sha256(value):
            _add_error(
                errors,
                "invalid_sha256",
                f"style.{hash_field}",
                f"style.{hash_field} must contain 64 hexadecimal characters",
            )
    if style.get("adapter_id") not in {None, "gpt-image"}:
        _add_error(
            errors,
            "unsupported_style_adapter",
            "style.adapter_id",
            "This manifest extension currently requires the gpt-image adapter",
        )
    adapter_version = style.get("adapter_version")
    if adapter_version is not None and not (
        (isinstance(adapter_version, int) and not isinstance(adapter_version, bool) and adapter_version > 0)
        or _is_nonempty_string(adapter_version)
    ):
        _add_error(
            errors,
            "invalid_adapter_version",
            "style.adapter_version",
            "adapter_version must be a positive integer or non-empty string",
        )

    for field, hash_field in path_hash_pairs[:3]:
        if style.get(field) is not None:
            _validate_trace_file(
                errors=errors,
                style=style,
                field=field,
                hash_field=hash_field,
                root=skill_root,
                root_label="Skill",
            )
    manifest_root = manifest_path.parent.resolve()
    for field, hash_field in path_hash_pairs[3:]:
        if style.get(field) is not None:
            _validate_trace_file(
                errors=errors,
                style=style,
                field=field,
                hash_field=hash_field,
                root=manifest_root,
                root_label="manifest",
            )


def _validate_top_level(
    data: dict[str, Any],
    skill_root: Path,
    manifest_path: Path,
    errors: list[dict[str, str]],
) -> bool:
    version = data.get("manifest_version")
    if version == 1:
        _validate_top_level_v1(data, errors)
        return False
    if version != 2:
        _add_error(
            errors,
            "unsupported_manifest_version",
            "manifest_version",
            "manifest_version must be 1 or 2",
        )
        return False

    compatibility = dict(data)
    compatibility["manifest_version"] = 1
    compatibility["style"] = {
        "profile_id": data.get("style", {}).get("profile_id", "invalid")
        if isinstance(data.get("style"), dict)
        else "invalid",
        "fingerprint": "manifest-v2-style-contract",
    }
    compatibility_approvals = dict(data.get("approvals", {}))
    compatibility_approvals.setdefault("style_anchor", "not_required")
    compatibility["approvals"] = compatibility_approvals
    _validate_top_level_v1(compatibility, errors)
    contract_drift = _validate_style_v2(data, skill_root, errors)
    _validate_style_pack_v3_manifest(data, skill_root, manifest_path, errors)
    return contract_drift


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


def _validate_cover_title(
    asset: dict[str, Any],
    index: int,
    manifest_path: Path,
    phase: str,
    require_title: bool,
    require_square_crop: bool,
    errors: list[dict[str, str]],
) -> None:
    base = f"assets[{index}].title"
    title = asset.get("title")
    if not isinstance(title, dict):
        if require_title:
            _add_error(
                errors,
                "missing_cover_title",
                base,
                "WeChat cover assets require a title contract",
            )
        return

    mode = title.get("mode")
    if mode not in VALID_COVER_TITLE_MODES:
        _add_error(
            errors,
            "invalid_cover_title_mode",
            f"{base}.mode",
            f"title.mode must be one of {sorted(VALID_COVER_TITLE_MODES)}",
        )
        return

    if mode == "text-free":
        if title.get("user_opt_out") is not True:
            _add_error(
                errors,
                "text_free_without_user_opt_out",
                f"{base}.user_opt_out",
                "a text-free cover title contract requires an explicit user opt-out",
            )
        return

    text_lines = title.get("text_lines")
    if (
        not isinstance(text_lines, list)
        or not text_lines
        or any(not _is_nonempty_string(line) for line in text_lines)
    ):
        _add_error(
            errors,
            "missing_cover_title_text",
            f"{base}.text_lines",
            "deterministic cover titles require non-empty text_lines",
        )

    supporting_points = title.get("supporting_points")
    if supporting_points is not None and (
        not isinstance(supporting_points, list)
        or not 1 <= len(supporting_points) <= 4
        or any(not _is_nonempty_string(point) for point in supporting_points)
    ):
        _add_error(
            errors,
            "invalid_cover_supporting_points",
            f"{base}.supporting_points",
            "supporting_points must contain one to four non-empty strings when present",
        )

    editable_source = title.get("editable_source_path")
    if not _is_safe_relative_path(editable_source):
        _add_error(
            errors,
            "missing_cover_title_source",
            f"{base}.editable_source_path",
            "deterministic cover titles require a platform-safe editable SVG or HTML source path",
        )
    elif Path(editable_source).suffix.lower() not in {".svg", ".html", ".htm"}:
        _add_error(
            errors,
            "invalid_cover_title_source_format",
            f"{base}.editable_source_path",
            "cover title source must be SVG or HTML",
        )

    background_artifact = title.get("background_artifact_path")
    if not _is_safe_relative_path(background_artifact):
        _add_error(
            errors,
            "missing_cover_background",
            f"{base}.background_artifact_path",
            "deterministic cover titles require a platform-safe text-free background artifact path",
        )
    elif Path(background_artifact).suffix.lower() not in {".png", ".jpg", ".jpeg"}:
        _add_error(
            errors,
            "invalid_cover_background_format",
            f"{base}.background_artifact_path",
            "cover background artifact must be PNG or JPEG",
        )
    elif background_artifact == asset.get("artifact_path"):
        _add_error(
            errors,
            "cover_background_final_collision",
            f"{base}.background_artifact_path",
            "text-free cover background must differ from the final composed artifact",
        )

    if phase == "integration":
        crop_fields = ["wide_crop_checked"]
        if require_square_crop:
            crop_fields.append("square_crop_checked")
        for field in crop_fields:
            if title.get(field) is not True:
                _add_error(
                    errors,
                    "cover_title_crop_not_checked",
                    f"{base}.{field}",
                    "deterministic cover titles require the platform's verified crop checks",
                )
        manifest_root = manifest_path.parent.resolve()
        if _is_safe_relative_path(editable_source):
            absolute_source = (manifest_root / editable_source).resolve()
            if not _resolved_is_under(absolute_source, manifest_root):
                _add_error(
                    errors,
                    "cover_title_source_escape",
                    f"{base}.editable_source_path",
                    "resolved cover title source escapes the manifest directory",
                )
            elif not absolute_source.is_file():
                _add_error(
                    errors,
                    "cover_title_source_missing",
                    f"{base}.editable_source_path",
                    f"cover title source does not exist: {editable_source}",
                )
        if _is_safe_relative_path(background_artifact):
            absolute_background = (manifest_root / background_artifact).resolve()
            if not _resolved_is_under(absolute_background, manifest_root):
                _add_error(
                    errors,
                    "cover_background_escape",
                    f"{base}.background_artifact_path",
                    "resolved cover background escapes the manifest directory",
                )
            elif not absolute_background.is_file():
                _add_error(
                    errors,
                    "cover_background_missing",
                    f"{base}.background_artifact_path",
                    f"cover background does not exist: {background_artifact}",
                )


def _validate_asset_style_v2(
    asset: dict[str, Any],
    index: int,
    phase: str,
    approved_reference_ids: set[str],
    style_pack_version: int | None,
    errors: list[dict[str, str]],
) -> None:
    base = f"assets[{index}].style_validation"
    validation = asset.get("style_validation")
    if not isinstance(validation, dict):
        _add_error(
            errors,
            "missing_style_validation",
            base,
            "Manifest v2 assets require a style_validation object",
        )
        return
    references = validation.get("golden_reference_ids")
    if (
        not isinstance(references, list)
        or not references
        or any(item not in approved_reference_ids for item in references)
    ):
        _add_error(
            errors,
            "invalid_golden_references",
            f"{base}.golden_reference_ids",
            "Asset style validation must cite approved golden reference IDs",
        )
    forbidden = validation.get("forbidden_traits_found")
    if not isinstance(forbidden, list):
        _add_error(
            errors,
            "invalid_style_validation",
            f"{base}.forbidden_traits_found",
            "forbidden_traits_found must be an array",
        )
        forbidden = []
    if validation.get("theme_bleed") not in {True, False}:
        _add_error(
            errors,
            "invalid_style_validation",
            f"{base}.theme_bleed",
            "theme_bleed must be boolean",
        )
    if style_pack_version == 3:
        drift_codes = validation.get("drift_codes")
        if not isinstance(drift_codes, list):
            _add_error(
                errors,
                "missing_style_pack_field",
                f"{base}.drift_codes",
                "Style Pack v3 assets require a drift_codes array",
            )
        else:
            for drift_index, drift_code in enumerate(drift_codes):
                if drift_code not in VALID_DRIFT_CODES:
                    _add_error(
                        errors,
                        "invalid_drift_code",
                        f"{base}.drift_codes[{drift_index}]",
                        "drift_codes must use the approved Style Pack v3 error codes",
                    )
    if phase != "integration":
        if validation.get("status") not in {"planned", "pending", "passed", "failed"}:
            _add_error(
                errors,
                "invalid_style_validation",
                f"{base}.status",
                "Style validation status is invalid",
            )
        return
    if validation.get("status") != "passed":
        _add_error(
            errors,
            "style_validation_not_passed",
            f"{base}.status",
            "Integration requires style_validation.status=passed",
        )
    if validation.get("required_traits_passed") is not True:
        _add_error(
            errors,
            "required_style_trait_missing",
            f"{base}.required_traits_passed",
            "Integration requires all required profile traits to pass",
        )
    if forbidden:
        _add_error(
            errors,
            "forbidden_style_trait",
            f"{base}.forbidden_traits_found",
            "Forbidden visual traits were detected",
        )
    if validation.get("theme_bleed") is True:
        _add_error(
            errors,
            "style_theme_bleed",
            f"{base}.theme_bleed",
            "Publication theme has overridden the selected visual profile",
        )
    if validation.get("series_continuity") != "passed":
        _add_error(
            errors,
            "series_continuity_not_passed",
            f"{base}.series_continuity",
            "Integration requires series_continuity=passed",
        )


def validate_manifest(
    data: dict[str, Any],
    manifest_path: Path,
    phase: str,
    skill_root: Path | None = None,
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

    effective_skill_root = (
        Path(skill_root).resolve()
        if skill_root is not None
        else Path(__file__).resolve().parents[1]
    )
    contract_drift = _validate_top_level(
        data, effective_skill_root, manifest_path, errors
    )
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
    platforms = data.get("platforms")
    version = data.get("manifest_version")
    style = data.get("style")
    style_pack_version = (
        style.get("style_pack_version") if isinstance(style, dict) else None
    )
    approved_reference_ids = (
        set(style.get("golden_reference_ids", []))
        if version == 2 and isinstance(style, dict)
        else set()
    )
    for index, asset in enumerate(assets):
        asset_id, markdown_path = _validate_asset(
            asset, index, manifest_path, phase, asset_directory, errors
        )
        effective_platforms = platforms
        if isinstance(asset, dict) and "platforms" in asset:
            asset_platforms = asset.get("platforms")
            if (
                not isinstance(asset_platforms, list)
                or not asset_platforms
                or any(platform not in VALID_PLATFORMS for platform in asset_platforms)
                or len(set(asset_platforms)) != len(asset_platforms)
            ):
                _add_error(
                    errors,
                    "invalid_asset_platforms",
                    f"assets[{index}].platforms",
                    f"asset platforms must be a non-empty unique subset of {sorted(VALID_PLATFORMS)}",
                )
                effective_platforms = []
            else:
                effective_platforms = asset_platforms
        if isinstance(asset, dict) and asset.get("role") == "cover":
            has_wechat = (
                isinstance(effective_platforms, list)
                and "wechat" in effective_platforms
            )
            if has_wechat or "title" in asset:
                _validate_cover_title(
                    asset,
                    index,
                    manifest_path,
                    phase,
                    require_title=has_wechat,
                    require_square_crop=has_wechat,
                    errors=errors,
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
        if version == 2 and isinstance(asset, dict):
            _validate_asset_style_v2(
                asset,
                index,
                phase,
                approved_reference_ids,
                style_pack_version,
                errors,
            )

    approvals = data.get("approvals")
    style_anchor = approvals.get("style_anchor") if isinstance(approvals, dict) else None
    if version == 1 and phase == "integration" and raster_count >= 3 and style_anchor != "approved":
        _add_error(
            errors,
            "style_anchor_not_approved",
            "approvals.style_anchor",
            "three or more imagegen assets require an approved style anchor",
        )
    if version == 2:
        article_approval = (
            approvals.get("article_style_anchor")
            if isinstance(approvals, dict)
            else None
        )
        references = style.get("article_reference_paths") if isinstance(style, dict) else []
        deterministic_exception = (
            len(assets) == 1
            and raster_count == 0
            and not references
            and not contract_drift
            and all(
                isinstance(asset, dict)
                and asset.get("renderer")
                in {"deterministic-diagram", "deterministic-chart"}
                for asset in assets
            )
        )
        requires_anchor = not deterministic_exception
        if article_approval not in {"approved", "not_required"}:
            _add_error(
                errors,
                "invalid_approval_state",
                "approvals.article_style_anchor",
                "article_style_anchor must be approved or not_required",
            )
        if requires_anchor and article_approval != "approved":
            _add_error(
                errors,
                "article_style_anchor_required",
                "approvals.article_style_anchor",
                "Imagegen, article references, or contract drift require an approved article style anchor",
            )
        anchor_id = (
            style.get("article_style_anchor_asset_id")
            if isinstance(style, dict)
            else None
        )
        if anchor_id is not None and anchor_id not in asset_ids:
            _add_error(
                errors,
                "unknown_style_anchor_asset",
                "style.article_style_anchor_asset_id",
                "article_style_anchor_asset_id must name an asset in this manifest",
            )
        if requires_anchor and anchor_id is None:
            _add_error(
                errors,
                "unknown_style_anchor_asset",
                "style.article_style_anchor_asset_id",
                "An approved article style anchor must name its anchor asset",
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
