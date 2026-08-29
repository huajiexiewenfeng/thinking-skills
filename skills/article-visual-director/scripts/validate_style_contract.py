from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


VALID_PHASES = {"protocol", "release"}
REQUIRED_GOLDEN_ROLES = {"cover", "concept", "diagram"}


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
        for field in ("protocol_path", "tokens_path", "golden_set_path")
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
