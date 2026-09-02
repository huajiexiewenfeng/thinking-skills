from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = SKILL_ROOT / "scripts" / "list_style_previews.py"


def load_preview_module():
    if not SCRIPT_PATH.is_file():
        raise AssertionError(f"preview resolver does not exist: {SCRIPT_PATH}")
    spec = importlib.util.spec_from_file_location("list_style_previews", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError(f"cannot load preview resolver: {SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class StylePreviewResolverTests(unittest.TestCase):
    def test_all_registered_styles_have_verified_absolute_cover_paths(self) -> None:
        module = load_preview_module()

        previews = module.collect_style_previews(SKILL_ROOT)

        self.assertEqual(list(range(1, 10)), [item["ordinal"] for item in previews])
        self.assertTrue(all(item["status"] == "available" for item in previews))
        self.assertTrue(
            all(Path(item["absolute_path"]).is_absolute() for item in previews)
        )
        self.assertTrue(
            all(Path(item["absolute_path"]).is_file() for item in previews)
        )

    def test_missing_cover_artifact_fails_closed_without_a_path(self) -> None:
        module = load_preview_module()
        with tempfile.TemporaryDirectory() as temporary_directory:
            skill_root = Path(temporary_directory)
            registry_path = skill_root / "references" / "style-registry.json"
            golden_path = (
                skill_root
                / "assets"
                / "style-anchors"
                / "fixture-style"
                / "golden-set.json"
            )
            registry_path.parent.mkdir(parents=True)
            golden_path.parent.mkdir(parents=True)
            registry_path.write_text(
                json.dumps(
                    {
                        "registry_version": 1,
                        "profiles": [
                            {
                                "ordinal": 1,
                                "profile_id": "fixture-style",
                                "name_en": "Fixture Style",
                                "name_zh": "测试风格",
                                "golden_set_path": (
                                    "assets/style-anchors/fixture-style/"
                                    "golden-set.json"
                                ),
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            golden_path.write_text(
                json.dumps(
                    {
                        "status": "approved",
                        "user_approval": {"status": "approved"},
                        "assets": [
                            {
                                "role": "cover",
                                "artifact_path": "missing-cover.png",
                                "artifact_sha256": "0" * 64,
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            previews = module.collect_style_previews(skill_root)

        self.assertEqual("unavailable", previews[0]["status"])
        self.assertEqual("artifact_missing", previews[0]["reason"])
        self.assertNotIn("absolute_path", previews[0])

    def test_golden_set_path_cannot_escape_the_skill_root(self) -> None:
        module = load_preview_module()
        with tempfile.TemporaryDirectory() as temporary_directory:
            fixture_root = Path(temporary_directory)
            skill_root = fixture_root / "skill"
            registry_path = skill_root / "references" / "style-registry.json"
            golden_path = fixture_root / "outside" / "golden-set.json"
            cover_path = golden_path.parent / "cover.png"
            registry_path.parent.mkdir(parents=True)
            golden_path.parent.mkdir(parents=True)
            cover_path.write_bytes(b"verified-cover")
            registry_path.write_text(
                json.dumps(
                    {
                        "registry_version": 1,
                        "profiles": [
                            {
                                "ordinal": 1,
                                "profile_id": "fixture-style",
                                "name_en": "Fixture Style",
                                "name_zh": "测试风格",
                                "golden_set_path": "../outside/golden-set.json",
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            golden_path.write_text(
                json.dumps(
                    {
                        "status": "approved",
                        "user_approval": {"status": "approved"},
                        "assets": [
                            {
                                "role": "cover",
                                "artifact_path": "cover.png",
                                "artifact_sha256": hashlib.sha256(
                                    cover_path.read_bytes()
                                ).hexdigest(),
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            previews = module.collect_style_previews(skill_root)

        self.assertEqual("unavailable", previews[0]["status"])
        self.assertEqual("golden_set_unavailable", previews[0]["reason"])
        self.assertNotIn("absolute_path", previews[0])


if __name__ == "__main__":
    unittest.main()
