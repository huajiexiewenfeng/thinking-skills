from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from portable_hash import sha256_matches_file


UNAVAILABLE = "unavailable"


def _base_result(profile: dict[str, Any]) -> dict[str, object]:
    return {
        "ordinal": profile["ordinal"],
        "profile_id": profile["profile_id"],
        "name_en": profile["name_en"],
        "name_zh": profile["name_zh"],
    }


def _unavailable(
    profile: dict[str, Any], reason: str
) -> dict[str, object]:
    return {**_base_result(profile), "status": UNAVAILABLE, "reason": reason}


def _load_json_object(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def _resolve_profile_preview(
    skill_root: Path, profile: dict[str, Any]
) -> dict[str, object]:
    golden_set_relative = profile.get("golden_set_path")
    if not isinstance(golden_set_relative, str) or not golden_set_relative:
        return _unavailable(profile, "golden_set_unavailable")

    golden_set_path = (skill_root / golden_set_relative).resolve()
    try:
        golden_set_path.relative_to(skill_root)
    except ValueError:
        return _unavailable(profile, "golden_set_unavailable")
    golden_set = _load_json_object(golden_set_path)
    if golden_set is None:
        return _unavailable(profile, "golden_set_unavailable")
    if golden_set.get("status") != "approved":
        return _unavailable(profile, "golden_set_unavailable")
    user_approval = golden_set.get("user_approval")
    if not isinstance(user_approval, dict) or user_approval.get("status") != "approved":
        return _unavailable(profile, "golden_set_unavailable")

    assets = golden_set.get("assets")
    if not isinstance(assets, list):
        return _unavailable(profile, "cover_role_invalid")
    covers = [
        asset
        for asset in assets
        if isinstance(asset, dict) and asset.get("role") == "cover"
    ]
    if len(covers) != 1:
        return _unavailable(profile, "cover_role_invalid")

    cover = covers[0]
    artifact_relative = cover.get("artifact_path")
    if not isinstance(artifact_relative, str) or not artifact_relative:
        return _unavailable(profile, "artifact_path_invalid")
    artifact_path = (golden_set_path.parent / artifact_relative).resolve()
    try:
        artifact_path.relative_to(golden_set_path.parent.resolve())
    except ValueError:
        return _unavailable(profile, "artifact_path_invalid")
    if not artifact_path.is_file():
        return _unavailable(profile, "artifact_missing")

    artifact_sha256 = cover.get("artifact_sha256")
    if not isinstance(artifact_sha256, str) or len(artifact_sha256) != 64:
        return _unavailable(profile, "artifact_hash_mismatch")
    try:
        matches = sha256_matches_file(artifact_path, artifact_sha256)
    except OSError:
        matches = False
    if not matches:
        return _unavailable(profile, "artifact_hash_mismatch")

    return {
        **_base_result(profile),
        "status": "available",
        "absolute_path": artifact_path.as_posix(),
    }


def collect_style_previews(skill_root: Path) -> list[dict[str, object]]:
    skill_root = skill_root.resolve()
    registry = _load_json_object(skill_root / "references" / "style-registry.json")
    if registry is None or not isinstance(registry.get("profiles"), list):
        raise ValueError("style registry is unavailable or invalid")

    profiles = registry["profiles"]
    if not all(isinstance(profile, dict) for profile in profiles):
        raise ValueError("style registry profiles must be objects")
    return [
        _resolve_profile_preview(skill_root, profile)
        for profile in sorted(profiles, key=lambda item: item["ordinal"])
    ]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="List verified approved golden-cover previews for registered styles."
    )
    parser.add_argument(
        "--skill-root",
        type=Path,
        default=SCRIPT_DIR.parent,
        help="Path to the article-visual-director Skill root.",
    )
    args = parser.parse_args()
    print(
        json.dumps(
            collect_style_previews(args.skill_root),
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
