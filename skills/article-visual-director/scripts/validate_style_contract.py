from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


VALID_PHASES = {"protocol", "release"}
REQUIRED_GOLDEN_ROLES = {"cover", "concept", "diagram"}
STYLE_PACK_VERSION = 3
STYLE_PACK_PATH_FIELDS = (
    "visual_dna_path",
    "role_contracts_path",
    "reference_matrix_path",
)
REQUIRED_VISUAL_DNA_KEYS = {
    "profile_id",
    "style_pack_version",
    "surface",
    "palette_roles",
    "line_language",
    "material_and_texture",
    "geometry",
    "depth_and_camera",
    "typography",
    "density_and_spacing",
    "required_traits",
    "forbidden_traits",
    "neighbor_boundaries",
}
REQUIRED_ROLE_KEYS = {
    "stability",
    "must_preserve",
    "may_vary",
    "must_not_include",
    "acceptance_checks",
}
REQUIRED_NON_COPY_FIELDS = {"labels", "numbers", "nodes", "topology", "example_story"}
REQUIRED_QUALIFICATION_KEYS = {
    "prompt_compile_status",
    "cross_topic_probe_status",
    "neighbor_discrimination_status",
}
VAGUE_VISUAL_TRAITS = {
    "attractive",
    "beautiful",
    "clean",
    "good",
    "modern",
    "nice",
    "professional",
}


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object in {path}")
    return data


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _add_error(
    errors: list[dict[str, str]], code: str, path: str, message: str
) -> None:
    errors.append({"code": code, "path": path, "message": message})


def _safe_child(base: Path, relative: object) -> Path | None:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        return None
    base_resolved = base.resolve()
    candidate = (base_resolved / relative).resolve()
    try:
        candidate.relative_to(base_resolved)
    except ValueError:
        return None
    return candidate


def _validate_hashed_file(
    errors: list[dict[str, str]],
    base: Path,
    asset: dict[str, Any],
    field: str,
    hash_field: str,
    item_path: str,
) -> None:
    relative = asset.get(field)
    target = _safe_child(base, relative)
    if target is None:
        _add_error(
            errors,
            "golden_asset_path_invalid",
            f"{item_path}.{field}",
            "Golden asset paths must remain inside the profile golden directory.",
        )
        return
    if not target.is_file():
        _add_error(
            errors,
            "golden_asset_missing",
            f"{item_path}.{field}",
            f"Required golden file does not exist: {relative}",
        )
        return
    expected = asset.get(hash_field)
    actual = sha256_file(target)
    if not isinstance(expected, str) or expected.lower() != actual:
        _add_error(
            errors,
            "golden_asset_hash_mismatch",
            f"{item_path}.{hash_field}",
            f"SHA-256 drift detected for {relative}.",
        )


def _validate_release_set(
    errors: list[dict[str, str]],
    profile_index: int,
    profile_root: Path,
    golden: dict[str, Any],
) -> None:
    root_path = f"profiles[{profile_index}].golden_set"
    if golden.get("status") != "approved":
        _add_error(
            errors,
            "golden_set_pending",
            f"{root_path}.status",
            "Release requires an approved golden set.",
        )
        return
    approval = golden.get("user_approval")
    if not isinstance(approval, dict) or approval.get("status") != "approved":
        _add_error(
            errors,
            "golden_set_pending",
            f"{root_path}.user_approval.status",
            "Release requires explicit user approval.",
        )

    assets = golden.get("assets")
    if not isinstance(assets, list):
        _add_error(
            errors,
            "golden_roles_invalid",
            f"{root_path}.assets",
            "Approved golden sets require cover, concept, and diagram assets.",
        )
        return
    roles = [asset.get("role") for asset in assets if isinstance(asset, dict)]
    if len(assets) != 3 or set(roles) != REQUIRED_GOLDEN_ROLES or len(set(roles)) != 3:
        _add_error(
            errors,
            "golden_roles_invalid",
            f"{root_path}.assets",
            "Approved golden sets require exactly one cover, concept, and diagram.",
        )
        return

    for asset_index, asset in enumerate(assets):
        item_path = f"{root_path}.assets[{asset_index}]"
        if not isinstance(asset, dict):
            _add_error(errors, "golden_asset_invalid", item_path, "Asset must be an object.")
            continue
        _validate_hashed_file(
            errors, profile_root, asset, "artifact_path", "artifact_sha256", item_path
        )
        renderer = asset.get("renderer")
        if renderer == "imagegen":
            if not asset.get("reference_role"):
                _add_error(
                    errors,
                    "imagegen_reference_role_missing",
                    f"{item_path}.reference_role",
                    "Imagegen golden assets must declare how they anchor later references.",
                )
            _validate_hashed_file(
                errors, profile_root, asset, "prompt_path", "prompt_sha256", item_path
            )
        elif renderer == "deterministic-diagram":
            _validate_hashed_file(
                errors,
                profile_root,
                asset,
                "editable_source_path",
                "editable_source_sha256",
                item_path,
            )
        else:
            _add_error(
                errors,
                "golden_renderer_invalid",
                f"{item_path}.renderer",
                "Renderer must be imagegen or deterministic-diagram.",
            )


def _observable_list(value: object) -> bool:
    return (
        isinstance(value, list)
        and bool(value)
        and all(isinstance(item, str) and len(item.strip()) >= 8 for item in value)
    )


def _observable_visual_traits(value: object) -> bool:
    return _observable_list(value) and all(
        item.strip().lower() not in VAGUE_VISUAL_TRAITS for item in value
    )


def _load_pack_file(
    errors: list[dict[str, str]],
    skill_root: Path,
    profile_prefix: str,
    registry_item: dict[str, Any],
    field: str,
    invalid_code: str,
) -> tuple[Path | None, dict[str, Any] | None]:
    relative = registry_item.get(field)
    if not isinstance(relative, str) or not relative:
        _add_error(
            errors,
            "style_pack_path_missing",
            f"{profile_prefix}.{field}",
            "Style Pack v3 profiles must declare every pack contract path.",
        )
        return None, None
    target = _safe_child(skill_root, relative)
    if target is None:
        _add_error(
            errors,
            "registry_path_invalid",
            f"{profile_prefix}.{field}",
            "Registry paths must be relative and remain under the Skill root.",
        )
        return None, None
    if not target.is_file():
        _add_error(
            errors,
            "contract_file_missing",
            f"{profile_prefix}.{field}",
            f"Contract file does not exist: {relative}",
        )
        return target, None
    try:
        return target, load_json(target)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        _add_error(errors, invalid_code, f"{profile_prefix}.{field}", str(exc))
        return target, None


def _validate_style_pack_v3(
    errors: list[dict[str, str]],
    skill_root: Path,
    profile_index: int,
    registry_item: dict[str, Any],
    golden: dict[str, Any],
    phase: str,
) -> None:
    if registry_item.get("style_pack_version") != STYLE_PACK_VERSION:
        return

    prefix = f"profiles[{profile_index}]"
    expected_id = registry_item.get("profile_id")
    adapter_ids = registry_item.get("adapter_ids")
    if not isinstance(adapter_ids, list) or not adapter_ids or not all(
        isinstance(adapter_id, str) and adapter_id.strip() for adapter_id in adapter_ids
    ):
        _add_error(
            errors,
            "style_pack_adapter_invalid",
            f"{prefix}.adapter_ids",
            "Style Pack v3 profiles require at least one named model adapter.",
        )

    loaded: dict[str, tuple[Path | None, dict[str, Any] | None]] = {}
    invalid_codes = {
        "visual_dna_path": "visual_dna_invalid",
        "role_contracts_path": "role_contracts_invalid",
        "reference_matrix_path": "reference_matrix_invalid",
    }
    for field in STYLE_PACK_PATH_FIELDS:
        loaded[field] = _load_pack_file(
            errors,
            skill_root,
            prefix,
            registry_item,
            field,
            invalid_codes[field],
        )

    for field, (_, document) in loaded.items():
        if document is not None and (
            document.get("profile_id") != expected_id
            or document.get("style_pack_version") != STYLE_PACK_VERSION
        ):
            _add_error(
                errors,
                "profile_identity_mismatch",
                f"{prefix}.{field}",
                "Style Pack identity/version must match the registry.",
            )

    _, visual_dna = loaded["visual_dna_path"]
    visual_dna_valid = isinstance(visual_dna, dict)
    if visual_dna_valid:
        visual_dna_valid = REQUIRED_VISUAL_DNA_KEYS.issubset(visual_dna)
    if visual_dna_valid:
        structured_fields = (
            "surface",
            "palette_roles",
            "line_language",
            "material_and_texture",
            "geometry",
            "depth_and_camera",
            "typography",
            "density_and_spacing",
        )
        visual_dna_valid = all(
            isinstance(visual_dna.get(field), dict) and bool(visual_dna[field])
            for field in structured_fields
        )
    if visual_dna_valid:
        boundaries = visual_dna.get("neighbor_boundaries")
        visual_dna_valid = (
            _observable_visual_traits(visual_dna.get("required_traits"))
            and _observable_visual_traits(visual_dna.get("forbidden_traits"))
            and isinstance(boundaries, list)
            and bool(boundaries)
            and all(
                isinstance(boundary, dict)
                and isinstance(boundary.get("profile_id"), str)
                and bool(boundary["profile_id"].strip())
                and isinstance(boundary.get("difference"), str)
                and len(boundary["difference"].strip()) >= 8
                for boundary in boundaries
            )
        )
    if visual_dna is not None and not visual_dna_valid:
        _add_error(
            errors,
            "visual_dna_invalid",
            f"{prefix}.visual_dna_path",
            "Visual DNA must contain observable traits and explicit neighbor boundaries.",
        )

    _, role_contracts = loaded["role_contracts_path"]
    role_contracts_valid = isinstance(role_contracts, dict)
    roles = role_contracts.get("roles") if role_contracts_valid else None
    role_contracts_valid = (
        role_contracts_valid
        and isinstance(roles, dict)
        and set(roles) == REQUIRED_GOLDEN_ROLES
    )
    if role_contracts_valid:
        for role, contract in roles.items():
            expected_stability = "strict" if role == "diagram" else "family"
            if (
                not isinstance(contract, dict)
                or not REQUIRED_ROLE_KEYS.issubset(contract)
                or contract.get("stability") != expected_stability
                or not all(
                    _observable_list(contract.get(field))
                    for field in (
                        "must_preserve",
                        "may_vary",
                        "must_not_include",
                        "acceptance_checks",
                    )
                )
            ):
                role_contracts_valid = False
                break
    if role_contracts is not None and not role_contracts_valid:
        _add_error(
            errors,
            "role_contracts_invalid",
            f"{prefix}.role_contracts_path",
            "Role contracts must define family-stable cover/concept and a strict diagram contract.",
        )

    _, reference_matrix = loaded["reference_matrix_path"]
    references = (
        reference_matrix.get("references")
        if isinstance(reference_matrix, dict)
        else None
    )
    reference_matrix_valid = (
        isinstance(references, list)
        and len(references) == 3
        and {
            reference.get("role")
            for reference in references
            if isinstance(reference, dict)
        }
        == REQUIRED_GOLDEN_ROLES
    )
    golden_assets = golden.get("assets")
    golden_ids_by_role = (
        {
            asset.get("role"): asset.get("id")
            for asset in golden_assets
            if isinstance(asset, dict)
        }
        if isinstance(golden_assets, list)
        else {}
    )
    if reference_matrix_valid:
        for reference in references:
            role = reference.get("role")
            non_copy = reference.get("must_not_copy")
            if (
                not isinstance(reference.get("golden_asset_id"), str)
                or not reference["golden_asset_id"].strip()
                or not _observable_list(reference.get("must_preserve"))
                or not _observable_list(reference.get("may_vary"))
                or not isinstance(non_copy, list)
                or not REQUIRED_NON_COPY_FIELDS.issubset(non_copy)
                or (
                    golden_ids_by_role
                    and reference.get("golden_asset_id") != golden_ids_by_role.get(role)
                )
            ):
                reference_matrix_valid = False
                break
    if reference_matrix is not None and not reference_matrix_valid:
        _add_error(
            errors,
            "reference_matrix_invalid",
            f"{prefix}.reference_matrix_path",
            "Reference matrix must map one golden per role and separate preserved style from copied content.",
        )

    if golden.get("style_pack_version") != STYLE_PACK_VERSION:
        _add_error(
            errors,
            "style_pack_metadata_invalid",
            f"{prefix}.golden_set.style_pack_version",
            "Style Pack v3 goldens must declare style_pack_version 3.",
        )
    hash_fields = {
        "visual_dna_path": "visual_dna_sha256",
        "role_contracts_path": "role_contracts_sha256",
        "reference_matrix_path": "reference_matrix_sha256",
    }
    for field, hash_field in hash_fields.items():
        target, _ = loaded[field]
        if target is not None and target.is_file():
            expected_hash = golden.get(hash_field)
            if not isinstance(expected_hash, str) or expected_hash.lower() != sha256_file(target):
                _add_error(
                    errors,
                    "style_pack_hash_mismatch",
                    f"{prefix}.golden_set.{hash_field}",
                    f"SHA-256 drift detected for {registry_item.get(field)}.",
                )

    if phase == "release":
        qualification = golden.get("qualification")
        if not isinstance(qualification, dict) or any(
            qualification.get(field) != "passed"
            for field in REQUIRED_QUALIFICATION_KEYS
        ):
            _add_error(
                errors,
                "style_pack_not_qualified",
                f"{prefix}.golden_set.qualification",
                "Release requires prompt compile, cross-topic, and neighbor-discrimination qualification.",
            )


def validate_style_contract(
    skill_root: Path, phase: str, profile_id: str | None = None
) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    skill_root = Path(skill_root).resolve()
    if phase not in VALID_PHASES:
        return [{
            "code": "invalid_phase",
            "path": "phase",
            "message": "Phase must be protocol or release.",
        }]

    registry_path = skill_root / "references" / "style-registry.json"
    try:
        registry = load_json(registry_path)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return [{
            "code": "registry_invalid",
            "path": "references/style-registry.json",
            "message": str(exc),
        }]

    profiles = registry.get("profiles")
    if not isinstance(profiles, list) or not profiles:
        return [{
            "code": "registry_invalid",
            "path": "profiles",
            "message": "Registry must contain at least one profile.",
        }]

    if profile_id is not None:
        selected = [item for item in profiles if item.get("profile_id") == profile_id]
        if not selected:
            return [{
                "code": "unknown_profile",
                "path": "profile_id",
                "message": f"Unknown profile: {profile_id}",
            }]
        indexed_profiles = [(profiles.index(selected[0]), selected[0])]
    else:
        indexed_profiles = list(enumerate(profiles))

    ids = [item.get("profile_id") for item in profiles if isinstance(item, dict)]
    declared_paths = [
        item.get(field)
        for item in profiles if isinstance(item, dict)
        for field in (
            "protocol_path",
            "tokens_path",
            "golden_set_path",
            *STYLE_PACK_PATH_FIELDS,
        )
        if item.get(field) is not None
    ]
    if len(ids) != len(set(ids)) or len(declared_paths) != len(set(declared_paths)):
        _add_error(
            errors,
            "registry_identity_duplicate",
            "profiles",
            "Profile IDs and declared contract paths must be unique.",
        )

    for profile_index, item in indexed_profiles:
        prefix = f"profiles[{profile_index}]"
        expected_id = item.get("profile_id")
        expected_version = item.get("protocol_version")
        resolved: dict[str, Path] = {}
        for field in ("protocol_path", "tokens_path", "golden_set_path"):
            target = _safe_child(skill_root, item.get(field))
            if target is None:
                _add_error(
                    errors,
                    "registry_path_invalid",
                    f"{prefix}.{field}",
                    "Registry paths must be relative and remain under the Skill root.",
                )
            else:
                resolved[field] = target
                if not target.is_file():
                    _add_error(
                        errors,
                        "contract_file_missing",
                        f"{prefix}.{field}",
                        f"Contract file does not exist: {item.get(field)}",
                    )
        if "tokens_path" in resolved and resolved["tokens_path"].is_file():
            try:
                tokens = load_json(resolved["tokens_path"])
            except (OSError, ValueError, json.JSONDecodeError) as exc:
                _add_error(errors, "tokens_invalid", f"{prefix}.tokens_path", str(exc))
            else:
                if (
                    tokens.get("profile_id") != expected_id
                    or tokens.get("protocol_version") != expected_version
                ):
                    _add_error(
                        errors,
                        "profile_identity_mismatch",
                        f"{prefix}.tokens_path",
                        "Token identity/version must match the registry.",
                    )
        if "golden_set_path" not in resolved or not resolved["golden_set_path"].is_file():
            continue
        try:
            golden = load_json(resolved["golden_set_path"])
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            _add_error(errors, "golden_set_invalid", f"{prefix}.golden_set_path", str(exc))
            continue
        if (
            golden.get("profile_id") != expected_id
            or golden.get("protocol_version") != expected_version
        ):
            _add_error(
                errors,
                "profile_identity_mismatch",
                f"{prefix}.golden_set_path",
                "Golden-set identity/version must match the registry.",
            )
        _validate_style_pack_v3(
            errors, skill_root, profile_index, item, golden, phase
        )
        if phase == "protocol":
            if golden.get("status") not in {"candidate", "approved"}:
                _add_error(
                    errors,
                    "golden_status_invalid",
                    f"{prefix}.golden_set.status",
                    "Protocol phase accepts candidate or approved golden sets.",
                )
        else:
            _validate_release_set(
                errors, profile_index, resolved["golden_set_path"].parent, golden
            )
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate article visual style contracts.")
    parser.add_argument("--phase", choices=sorted(VALID_PHASES), required=True)
    parser.add_argument("--profile")
    parser.add_argument(
        "--skill-root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    args = parser.parse_args()
    errors = validate_style_contract(args.skill_root, args.phase, args.profile)
    result = {"overall": "failed" if errors else "passed", "errors": errors}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
