from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from validate_style_contract import validate_style_contract  # noqa: E402


HEADINGS = [
    "Identity", "Use When", "Do Not Use When", "Mode Boundary",
    "Required Visual Traits", "Allowed Variation", "Forbidden Traits",
    "Cover Contract", "Concept Contract", "Deterministic Diagram Contract",
    "Imagegen Prompt Contract", "Reference Use Contract", "Validation Rubric",
]


class ValidateStyleContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.skill_root = Path(self.temp_dir.name)
        references = self.skill_root / "references"
        styles = references / "styles"
        styles.mkdir(parents=True)
        self.profile_root = self.skill_root / "assets" / "style-anchors" / "fixture-profile"
        self.profile_root.mkdir(parents=True)
        self.protocol_path = styles / "01-fixture-profile.md"
        self.tokens_path = styles / "01-fixture-profile.tokens.json"
        self.protocol_path.write_text(
            "# Fixture\n\n" + "\n\n".join(f"## {heading}\n\nFixture." for heading in HEADINGS),
            encoding="utf-8",
        )
        self.tokens_path.write_text(
            json.dumps({"profile_id": "fixture-profile", "protocol_version": 2}),
            encoding="utf-8",
        )
        registry = {
            "registry_version": 1,
            "profiles": [{
                "ordinal": 1,
                "profile_id": "fixture-profile",
                "name_en": "Fixture Profile",
                "name_zh": "测试模式",
                "protocol_version": 2,
                "protocol_path": "references/styles/01-fixture-profile.md",
                "tokens_path": "references/styles/01-fixture-profile.tokens.json",
                "golden_set_path": "assets/style-anchors/fixture-profile/golden-set.json",
            }],
        }
        (references / "style-registry.json").write_text(
            json.dumps(registry), encoding="utf-8"
        )
        self._write_golden_set({
            "golden_set_version": 1,
            "profile_id": "fixture-profile",
            "protocol_version": 2,
            "status": "candidate",
            "user_approval": {"status": "pending", "revision_notes": []},
            "assets": [],
        })

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _sha256(self, path: Path) -> str:
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def _write_golden_set(self, data: dict) -> None:
        (self.profile_root / "golden-set.json").write_text(
            json.dumps(data), encoding="utf-8"
        )

    def approve_fixture_with_three_assets(self) -> None:
        files = {
            "golden-cover.png": b"cover",
            "golden-concept.png": b"concept",
            "golden-diagram.png": b"diagram",
            "golden-diagram.svg": b"<svg/>",
            "golden-cover.prompt.md": b"cover prompt",
            "golden-concept.prompt.md": b"concept prompt",
        }
        for name, content in files.items():
            (self.profile_root / name).write_bytes(content)

        assets = []
        for role in ("cover", "concept"):
            artifact = self.profile_root / f"golden-{role}.png"
            prompt = self.profile_root / f"golden-{role}.prompt.md"
            assets.append({
                "id": f"fixture-{role}",
                "role": role,
                "renderer": "imagegen",
                "artifact_path": artifact.name,
                "artifact_sha256": self._sha256(artifact),
                "prompt_path": prompt.name,
                "prompt_sha256": self._sha256(prompt),
                "reference_role": "composition-and-style-anchor",
            })
        diagram = self.profile_root / "golden-diagram.png"
        source = self.profile_root / "golden-diagram.svg"
        assets.append({
            "id": "fixture-diagram",
            "role": "diagram",
            "renderer": "deterministic-diagram",
            "artifact_path": diagram.name,
            "artifact_sha256": self._sha256(diagram),
            "editable_source_path": source.name,
            "editable_source_sha256": self._sha256(source),
        })
        self._write_golden_set({
            "golden_set_version": 1,
            "profile_id": "fixture-profile",
            "protocol_version": 2,
            "status": "approved",
            "user_approval": {"status": "approved", "revision_notes": []},
            "assets": assets,
        })

    def test_protocol_phase_accepts_candidate_golden_sets(self) -> None:
        self.assertEqual([], validate_style_contract(self.skill_root, "protocol"))

    def test_release_phase_rejects_candidate_status(self) -> None:
        errors = validate_style_contract(self.skill_root, "release")
        self.assertEqual("golden_set_pending", errors[0]["code"])
        self.assertEqual("profiles[0].golden_set.status", errors[0]["path"])

    def test_release_phase_rejects_missing_asset(self) -> None:
        self.approve_fixture_with_three_assets()
        (self.profile_root / "golden-cover.png").unlink()
        errors = validate_style_contract(self.skill_root, "release")
        self.assertTrue(any(error["code"] == "golden_asset_missing" for error in errors))

    def test_release_phase_rejects_hash_drift(self) -> None:
        self.approve_fixture_with_three_assets()
        (self.profile_root / "golden-cover.png").write_bytes(b"changed")
        errors = validate_style_contract(self.skill_root, "release")
        self.assertTrue(
            any(error["code"] == "golden_asset_hash_mismatch" for error in errors)
        )

    def test_profile_filter_allows_one_approved_mode_to_release(self) -> None:
        self.approve_fixture_with_three_assets()
        self.assertEqual(
            [], validate_style_contract(self.skill_root, "release", "fixture-profile")
        )

    def test_protocol_identity_must_match_registry(self) -> None:
        tokens = json.loads(self.tokens_path.read_text(encoding="utf-8"))
        tokens["profile_id"] = "wrong-profile"
        self.tokens_path.write_text(json.dumps(tokens), encoding="utf-8")
        errors = validate_style_contract(self.skill_root, "protocol")
        self.assertTrue(
            any(error["code"] == "profile_identity_mismatch" for error in errors)
        )


if __name__ == "__main__":
    unittest.main()
