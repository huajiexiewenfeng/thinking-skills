from __future__ import annotations

import importlib.util
import copy
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_ROOT = SKILL_ROOT / "scripts"
TEST_ROOT = SCRIPT_ROOT / "tests"
sys.path.insert(0, str(SCRIPT_ROOT))
sys.path.insert(0, str(TEST_ROOT))

from test_validate_manifest import make_manifest  # noqa: E402
from validate_manifest import validate_manifest  # noqa: E402


def load_preview_module():
    path = SKILL_ROOT / "scripts" / "list_style_previews.py"
    spec = importlib.util.spec_from_file_location("list_style_previews", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FreeformArtDirectionContractTests(unittest.TestCase):
    def test_menu_adds_dynamic_tenth_mode_without_registering_a_profile(self) -> None:
        registry = json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )
        previews = load_preview_module().collect_style_previews(SKILL_ROOT)

        self.assertEqual(9, len(registry["profiles"]))
        self.assertEqual(list(range(1, 11)), [item["ordinal"] for item in previews])
        freeform = previews[-1]
        self.assertEqual("freeform", freeform["selection_mode"])
        self.assertEqual("article-local-freeform", freeform["profile_id"])
        self.assertEqual("dynamic", freeform["status"])
        self.assertNotIn("absolute_path", freeform)
        self.assertEqual("每篇文章动态生成，不设固定黄金图", freeform["preview_note"])

    def test_skill_defines_article_local_locking_and_semantic_boundaries(self) -> None:
        skill = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        reference = (
            SKILL_ROOT / "references" / "freeform-art-direction.md"
        ).read_text(encoding="utf-8")
        combined = (skill + "\n" + reference).lower()

        for phrase in (
            "freeform art direction（自由定调）",
            "article-local-freeform",
            "no permanent golden",
            "article-local visual brief",
            "first approved anchor",
            "reset for every new article",
            "visual freedom never authorizes",
            "deterministic typography",
            "deterministic-diagram",
        ):
            self.assertIn(phrase.lower(), combined)


class FreeformManifestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.manifest_path = self.root / "visual-manifest.json"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def make_freeform(self, *, locked: bool = False) -> dict:
        data = make_manifest()
        data["manifest_version"] = 2
        asset = data["assets"][0]
        asset["style_validation"] = {
            "status": "planned",
            "continuity_reference_ids": [],
            "required_traits_passed": False,
            "forbidden_traits_found": [],
            "theme_bleed": False,
            "series_continuity": "planned",
            "review_notes": None,
        }
        data["style"] = {
            "selection_mode": "freeform",
            "freeform_state": "locked" if locked else "exploring",
            "profile_id": "article-local-freeform",
            "direction_id": "agent-runtime-r1",
            "direction_revision": 1,
            "source_article_sha256": data["source"]["sha256"],
            "publication_theme": "default",
            "theme_override_policy": "title-layer-only",
            "approved_overrides": [],
            "article_reference_paths": [],
            "article_style_anchor_asset_id": asset["id"],
            "article_style_brief_path": None,
            "article_style_brief_sha256": None,
            "anchor_artifact_sha256": None,
        }
        data["approvals"]["article_style_anchor"] = (
            "approved" if locked else "pending"
        )
        if locked:
            artifact = self.root / asset["artifact_path"]
            artifact.parent.mkdir(parents=True)
            artifact.write_bytes(b"approved-anchor")
            anchor_sha = hashlib.sha256(artifact.read_bytes()).hexdigest()
            brief = {
                "mode_id": "article-local-freeform",
                "direction_id": "agent-runtime-r1",
                "direction_revision": 1,
                "source_article_sha256": data["source"]["sha256"],
                "anchor_asset_id": asset["id"],
                "anchor_artifact_sha256": anchor_sha,
                "visual_dna": {
                    "surface": {}, "palette_roles": {}, "line_language": {},
                    "material_and_texture": {}, "geometry": {},
                    "depth_and_camera": {}, "typography": {},
                    "density_and_spacing": {}, "required_traits": [],
                    "forbidden_traits": [], "allowed_variation": [],
                },
                "role_contracts": {},
                "deterministic_tokens": {},
                "reference_policy": {"semantic_authority": False},
            }
            brief_path = self.root / "visual-sources" / "article-style-brief.json"
            brief_path.parent.mkdir(parents=True)
            brief_path.write_text(json.dumps(brief), encoding="utf-8")
            data["style"].update({
                "article_style_brief_path": "visual-sources/article-style-brief.json",
                "article_style_brief_sha256": hashlib.sha256(
                    brief_path.read_bytes()
                ).hexdigest(),
                "anchor_artifact_sha256": anchor_sha,
            })
        return data

    def errors(self, data: dict, phase: str = "plan") -> list[dict[str, str]]:
        return validate_manifest(
            data, self.manifest_path, phase, skill_root=SKILL_ROOT
        )

    def assert_error(self, data: dict, code: str, phase: str = "plan") -> None:
        errors = self.errors(data, phase)
        self.assertTrue(any(item["code"] == code for item in errors), errors)

    def test_exploration_plan_accepts_pending_anchor_without_permanent_contract(self) -> None:
        self.assertEqual([], self.errors(self.make_freeform()))

    def test_locked_freeform_plan_accepts_bound_brief_and_anchor_hash(self) -> None:
        self.assertEqual([], self.errors(self.make_freeform(locked=True)))

    def test_locked_freeform_requires_article_brief(self) -> None:
        data = self.make_freeform(locked=True)
        data["style"]["article_style_brief_path"] = None
        self.assert_error(data, "freeform_brief_missing")

    def test_locked_freeform_detects_brief_hash_drift(self) -> None:
        data = self.make_freeform(locked=True)
        data["style"]["article_style_brief_sha256"] = "0" * 64
        self.assert_error(data, "freeform_brief_hash_mismatch")

    def test_freeform_rejects_permanent_registered_contract_fields(self) -> None:
        data = self.make_freeform()
        data["style"]["golden_set_path"] = "assets/fake/golden-set.json"
        self.assert_error(data, "freeform_permanent_contract_forbidden")

    def test_non_anchor_asset_must_cite_article_anchor_for_continuity(self) -> None:
        data = self.make_freeform(locked=True)
        second = copy.deepcopy(data["assets"][0])
        second["id"] = "asset-second"
        second["artifact_path"] = "visual-renders/second.png"
        second["markdown_path"] = "assets/agent-runtime/second.png"
        second["style_validation"]["continuity_reference_ids"] = []
        data["assets"].append(second)
        self.assert_error(data, "freeform_anchor_reference_required")

    def test_exploring_freeform_cannot_integrate(self) -> None:
        data = self.make_freeform()
        self.assert_error(data, "freeform_not_locked", phase="integration")


if __name__ == "__main__":
    unittest.main()
