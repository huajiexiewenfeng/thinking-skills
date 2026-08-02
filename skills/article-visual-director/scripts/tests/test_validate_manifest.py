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
        "outputs": {
            "illustrated_markdown": "article-illustrated.md",
            "actual_illustrated_markdown": None,
            "asset_directory": "assets/agent-runtime",
        },
        "style": {
            "profile_id": "neon-systems",
            "fingerprint": "navy cyan green glass",
        },
        "approvals": {
            "plan": "approved",
            "style_anchor": "not_required",
        },
        "integration": {"status": "pending", "verification_status": "pending"},
        "assets": [
            {
                "id": "asset-02",
                "role": "concept",
                "reader_takeaway": "Runtime keeps execution inside explicit boundaries.",
                "visual_purpose": "Make the control loop memorable.",
                "renderer": "imagegen",
                "output_format": "png",
                "dimensions": {"width": 1600, "height": 900},
                "aspect_ratio": "16:9",
                "safe_area": "Keep essential content outside the outer 8 percent.",
                "anchor": {
                    "heading": "## Runtime Loop",
                    "occurrence": 1,
                    "placement": "section_end",
                    "context_sha256": "b" * 64,
                },
                "prompt": "A controlled runtime loop",
                "diagram_spec": None,
                "approval": "approved",
                "editable_source_path": None,
                "artifact_path": "visual-renders/02-concept-runtime-loop.png",
                "markdown_path": "assets/agent-runtime/02-concept-runtime-loop.png",
                "alt": "Runtime loop concept illustration",
                "caption": None,
                "generation_status": "complete",
                "validation_status": "passed",
                "insertion_status": "pending",
            }
        ],
    }


def matching_error(errors: list[dict], code: str) -> dict:
    return next(error for error in errors if error["code"] == code)


class ValidateManifestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.manifest_path = self.root / "visual-manifest.json"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def test_plan_phase_accepts_approved_manifest(self) -> None:
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

        error = matching_error(errors, "duplicate_asset_id")
        self.assertEqual("assets[1].id", error["path"])

    def test_three_raster_assets_require_style_anchor_for_integration(self) -> None:
        data = make_manifest()
        data["approvals"]["style_anchor"] = "pending"
        for index in (2, 3):
            asset = copy.deepcopy(data["assets"][0])
            asset["id"] = f"asset-0{index + 1}"
            asset["artifact_path"] = f"visual-renders/0{index + 1}-concept.png"
            asset["markdown_path"] = f"assets/agent-runtime/0{index + 1}-concept.png"
            data["assets"].append(asset)
        for asset in data["assets"]:
            artifact = self.root / asset["artifact_path"]
            artifact.parent.mkdir(parents=True, exist_ok=True)
            artifact.write_bytes(b"verified-image")

        errors = validate_manifest(data, self.manifest_path, "integration")

        error = matching_error(errors, "style_anchor_not_approved")
        self.assertEqual("approvals.style_anchor", error["path"])

    def test_integration_requires_passed_asset_and_existing_artifact(self) -> None:
        data = make_manifest()
        data["assets"][0]["validation_status"] = "pending"

        errors = validate_manifest(data, self.manifest_path, "integration")

        self.assertEqual(
            "assets[0].validation_status",
            matching_error(errors, "asset_not_validated")["path"],
        )
        self.assertEqual(
            "assets[0].artifact_path",
            matching_error(errors, "artifact_missing")["path"],
        )

        data["assets"][0]["validation_status"] = "passed"
        artifact = self.root / data["assets"][0]["artifact_path"]
        artifact.parent.mkdir(parents=True)
        artifact.write_bytes(b"image")
        self.assertEqual(
            [], validate_manifest(data, self.manifest_path, "integration")
        )

    def test_invalid_source_sha256_fails(self) -> None:
        data = make_manifest()
        data["source"]["sha256"] = "not-a-sha256"

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "invalid_sha256")
        self.assertEqual("source.sha256", error["path"])

    def test_missing_reader_takeaway_fails(self) -> None:
        data = make_manifest()
        del data["assets"][0]["reader_takeaway"]

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "missing_asset_field")
        self.assertEqual("assets[0].reader_takeaway", error["path"])

    def test_duplicate_markdown_destination_fails(self) -> None:
        data = make_manifest()
        duplicate = copy.deepcopy(data["assets"][0])
        duplicate["id"] = "asset-03"
        duplicate["artifact_path"] = "visual-renders/03-concept.png"
        data["assets"].append(duplicate)

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "duplicate_markdown_path")
        self.assertEqual("assets[1].markdown_path", error["path"])

    def test_deterministic_asset_requires_editable_source(self) -> None:
        data = make_manifest()
        asset = data["assets"][0]
        asset["role"] = "architecture"
        asset["renderer"] = "deterministic-diagram"
        asset["prompt"] = None
        asset["diagram_spec"] = {
            "nodes": [{"id": "runtime", "label": "Runtime"}],
            "edges": [],
            "blocked_unconfirmed_edges": [],
        }

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "missing_editable_source")
        self.assertEqual("assets[0].editable_source_path", error["path"])


if __name__ == "__main__":
    unittest.main()
