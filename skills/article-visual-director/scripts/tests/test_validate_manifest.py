from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from validate_manifest import load_manifest, validate_manifest  # noqa: E402


def make_manifest() -> dict:
    return {
        "manifest_version": 1,
        "source": {
            "path": "article.md",
            "sha256": "a" * 64,
            "encoding": "utf-8",
            "line_ending": "lf",
        },
        "article_slug": "agent-runtime",
        "platforms": ["csdn", "wechat"],
        "style": {
            "profile_id": "neon-systems",
            "fingerprint": "navy cyan green glass",
        },
        "approvals": {
            "plan": "approved",
            "style_anchor": "not_required",
        },
        "assets": [
            {
                "id": "asset-02",
                "role": "concept",
                "renderer": "imagegen",
                "anchor": {
                    "heading": "## Runtime Loop",
                    "occurrence": 1,
                    "placement": "section_end",
                    "context_sha256": "b" * 64,
                },
                "prompt": "A controlled runtime loop",
                "approval": "approved",
                "artifact_path": "02-concept-runtime-loop.png",
                "markdown_path": "assets/agent-runtime/02-concept-runtime-loop.png",
                "alt": "Runtime loop concept illustration",
                "caption": None,
                "generation_status": "complete",
                "validation_status": "passed",
                "insertion_status": "pending",
            }
        ],
    }


def error_codes(errors: list[dict]) -> set[str]:
    return {error["code"] for error in errors}


class ValidateManifestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.manifest_path = self.root / "visual-manifest.json"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def test_load_manifest_and_plan_phase_accept_approved_manifest(self) -> None:
        data = make_manifest()
        self.manifest_path.write_text(
            json.dumps(data, ensure_ascii=False), encoding="utf-8"
        )

        loaded = load_manifest(self.manifest_path)

        self.assertEqual([], validate_manifest(loaded, self.manifest_path, "plan"))

    def test_duplicate_asset_ids_fail(self) -> None:
        data = make_manifest()
        data["assets"].append(copy.deepcopy(data["assets"][0]))

        errors = validate_manifest(data, self.manifest_path, "plan")

        self.assertIn("duplicate_asset_id", error_codes(errors))

    def test_three_imagegen_assets_require_approved_style_anchor_for_integration(
        self,
    ) -> None:
        data = make_manifest()
        data["approvals"]["style_anchor"] = "pending"
        for index in (2, 3):
            asset = copy.deepcopy(data["assets"][0])
            asset["id"] = f"asset-0{index + 1}"
            asset["artifact_path"] = f"0{index + 1}-concept.png"
            data["assets"].append(asset)
        for asset in data["assets"]:
            (self.root / asset["artifact_path"]).write_bytes(b"verified-image")

        errors = validate_manifest(data, self.manifest_path, "integration")

        self.assertIn("style_anchor_not_approved", error_codes(errors))

    def test_integration_requires_validation_pass_and_existing_artifact(self) -> None:
        data = make_manifest()
        data["assets"][0]["validation_status"] = "pending"

        errors = validate_manifest(data, self.manifest_path, "integration")

        self.assertIn("asset_not_validated", error_codes(errors))
        self.assertIn("artifact_missing", error_codes(errors))

        data["assets"][0]["validation_status"] = "passed"
        (self.root / data["assets"][0]["artifact_path"]).write_bytes(b"image")
        self.assertEqual(
            [], validate_manifest(data, self.manifest_path, "integration")
        )

    def test_invalid_source_sha_fails(self) -> None:
        data = make_manifest()
        data["source"]["sha256"] = "not-a-sha256"

        errors = validate_manifest(data, self.manifest_path, "plan")

        self.assertIn("invalid_sha256", error_codes(errors))


if __name__ == "__main__":
    unittest.main()
