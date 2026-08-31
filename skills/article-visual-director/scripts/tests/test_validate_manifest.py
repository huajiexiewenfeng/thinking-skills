from __future__ import annotations

import copy
import hashlib
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


def make_wechat_cover_manifest() -> dict:
    data = make_manifest()
    asset = data["assets"][0]
    asset["role"] = "cover"
    asset["dimensions"] = {"width": 900, "height": 383}
    asset["aspect_ratio"] = "2.35:1"
    asset["title"] = {
        "mode": "deterministic",
        "text_lines": ["Agent Runtime", "让 AI 长期可靠地工作"],
        "supporting_points": ["Identity", "Retrieval", "Authority"],
        "editable_source_path": "visual-sources/01-cover-title.svg",
        "background_artifact_path": "visual-renders/01-cover-background.png",
        "user_opt_out": False,
        "wide_crop_checked": False,
        "square_crop_checked": False,
    }
    return data


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

    def test_style_9_imagegen_architecture_passes_exact_native_validation(self) -> None:
        data = make_manifest()
        data["style"]["profile_id"] = "dense-technical-infographic"
        asset = data["assets"][0]
        asset["role"] = "architecture"
        asset["renderer"] = "imagegen"
        asset["native_text_validation"] = {
            "status": "passed",
            "copy_ledger_status": "frozen",
            "visible_copy_status": "exact-match",
            "semantic_graph_status": "exact-match",
            "review_notes": "Every visible label, node, edge, direction, group, and invariant matches the approved ledgers.",
        }
        artifact = self.root / asset["artifact_path"]
        artifact.parent.mkdir(parents=True)
        artifact.write_bytes(b"verified-image")

        self.assertEqual(
            [], validate_manifest(data, self.manifest_path, "integration")
        )

    def test_other_profile_cannot_use_imagegen_architecture_exception(self) -> None:
        data = make_manifest()
        data["style"]["profile_id"] = "blueprint-linework"
        asset = data["assets"][0]
        asset["role"] = "architecture"
        asset["renderer"] = "imagegen"
        asset["native_text_validation"] = {
            "status": "passed",
            "copy_ledger_status": "frozen",
            "visible_copy_status": "exact-match",
            "semantic_graph_status": "exact-match",
            "review_notes": "Every visible semantic element was reviewed.",
        }

        errors = validate_manifest(data, self.manifest_path, "plan")

        self.assertEqual(
            "assets[0].renderer",
            matching_error(errors, "renderer_role_mismatch")["path"],
        )

    def test_style_9_imagegen_architecture_requires_semantic_graph_validation(self) -> None:
        data = make_manifest()
        data["style"]["profile_id"] = "dense-technical-infographic"
        asset = data["assets"][0]
        asset["role"] = "architecture"
        asset["renderer"] = "imagegen"
        asset["native_text_validation"] = {
            "status": "passed",
            "copy_ledger_status": "frozen",
            "visible_copy_status": "exact-match",
            "review_notes": "Copy was reviewed but semantic graph evidence is missing.",
        }

        errors = validate_manifest(data, self.manifest_path, "plan")

        self.assertEqual(
            "assets[0].native_text_validation",
            matching_error(errors, "native_text_validation_invalid")["path"],
        )

    def test_wechat_cover_requires_title_contract(self) -> None:
        data = make_wechat_cover_manifest()
        del data["assets"][0]["title"]

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "missing_cover_title")
        self.assertEqual("assets[0].title", error["path"])

    def test_deterministic_cover_title_requires_text_lines(self) -> None:
        data = make_wechat_cover_manifest()
        data["assets"][0]["title"]["text_lines"] = []

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "missing_cover_title_text")
        self.assertEqual("assets[0].title.text_lines", error["path"])

    def test_text_free_wechat_cover_requires_explicit_user_opt_out(self) -> None:
        data = make_wechat_cover_manifest()
        data["assets"][0]["title"] = {
            "mode": "text-free",
            "text_lines": [],
            "user_opt_out": False,
            "wide_crop_checked": False,
            "square_crop_checked": False,
        }

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "text_free_without_user_opt_out")
        self.assertEqual("assets[0].title.user_opt_out", error["path"])

    def test_deterministic_cover_title_requires_crop_checks_for_integration(
        self,
    ) -> None:
        data = make_wechat_cover_manifest()
        artifact = self.root / data["assets"][0]["artifact_path"]
        artifact.parent.mkdir(parents=True)
        artifact.write_bytes(b"image")

        errors = validate_manifest(data, self.manifest_path, "integration")

        self.assertEqual(
            "assets[0].title.wide_crop_checked",
            matching_error(errors, "cover_title_crop_not_checked")["path"],
        )
        crop_errors = [
            error for error in errors if error["code"] == "cover_title_crop_not_checked"
        ]
        self.assertEqual(
            {
                "assets[0].title.wide_crop_checked",
                "assets[0].title.square_crop_checked",
            },
            {error["path"] for error in crop_errors},
        )

    def test_deterministic_cover_title_requires_editable_source(self) -> None:
        data = make_wechat_cover_manifest()
        del data["assets"][0]["title"]["editable_source_path"]

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "missing_cover_title_source")
        self.assertEqual("assets[0].title.editable_source_path", error["path"])

    def test_integration_requires_existing_cover_title_source(self) -> None:
        data = make_wechat_cover_manifest()
        data["assets"][0]["title"]["wide_crop_checked"] = True
        data["assets"][0]["title"]["square_crop_checked"] = True
        artifact = self.root / data["assets"][0]["artifact_path"]
        artifact.parent.mkdir(parents=True)
        artifact.write_bytes(b"image")

        errors = validate_manifest(data, self.manifest_path, "integration")

        error = matching_error(errors, "cover_title_source_missing")
        self.assertEqual("assets[0].title.editable_source_path", error["path"])

    def test_valid_deterministic_wechat_cover_passes_plan(self) -> None:
        data = make_wechat_cover_manifest()

        self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

    def test_style_9_native_generated_wechat_cover_passes_integration(self) -> None:
        data = make_wechat_cover_manifest()
        data["style"]["profile_id"] = "dense-technical-infographic"
        asset = data["assets"][0]
        asset["title"] = {
            "mode": "native-generated",
            "text_lines": ["高并发服务：一次请求如何被稳定处理"],
            "supporting_points": ["限流", "隔离", "缓存", "降级"],
            "wide_crop_checked": True,
            "square_crop_checked": True,
        }
        asset["native_text_validation"] = {
            "status": "passed",
            "copy_ledger_status": "frozen",
            "visible_copy_status": "exact-match",
            "semantic_graph_status": "not-required",
            "review_notes": "Exact title and supporting copy verified at full resolution.",
        }
        artifact = self.root / asset["artifact_path"]
        artifact.parent.mkdir(parents=True)
        artifact.write_bytes(b"verified-image")

        self.assertEqual(
            [], validate_manifest(data, self.manifest_path, "integration")
        )

    def test_other_profile_rejects_native_generated_cover_title(self) -> None:
        data = make_wechat_cover_manifest()
        asset = data["assets"][0]
        asset["title"] = {
            "mode": "native-generated",
            "text_lines": ["Exact title"],
            "supporting_points": ["One"],
            "wide_crop_checked": True,
            "square_crop_checked": True,
        }

        errors = validate_manifest(data, self.manifest_path, "plan")

        self.assertEqual(
            "assets[0].title.mode",
            matching_error(errors, "invalid_cover_title_mode")["path"],
        )

    def test_explicit_text_free_wechat_cover_passes_plan(self) -> None:
        data = make_wechat_cover_manifest()
        data["assets"][0]["title"] = {
            "mode": "text-free",
            "text_lines": [],
            "editable_source_path": None,
            "user_opt_out": True,
            "wide_crop_checked": False,
            "square_crop_checked": False,
        }

        self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

    def test_csdn_only_cover_does_not_require_wechat_title_contract(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["csdn"]
        del data["assets"][0]["title"]

        self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

    def test_asset_platforms_scope_wechat_cover_title_contract(self) -> None:
        data = make_wechat_cover_manifest()
        data["assets"][0]["platforms"] = ["csdn"]
        del data["assets"][0]["title"]

        self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

    def test_x_article_is_a_supported_platform(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]

        self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

    def test_x_article_cover_may_omit_title_contract(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]
        del data["assets"][0]["title"]

        self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

    def test_x_article_deterministic_title_requires_background_artifact(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]
        del data["assets"][0]["title"]["background_artifact_path"]

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "missing_cover_background")
        self.assertEqual(
            "assets[0].title.background_artifact_path", error["path"]
        )

    def test_cover_supporting_points_must_be_one_to_four_nonempty_strings(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]
        data["assets"][0]["title"]["supporting_points"] = ["Identity", ""]

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "invalid_cover_supporting_points")
        self.assertEqual("assets[0].title.supporting_points", error["path"])

    def test_cover_background_must_differ_from_final_artifact(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]
        data["assets"][0]["title"]["background_artifact_path"] = data["assets"][0][
            "artifact_path"
        ]

        errors = validate_manifest(data, self.manifest_path, "plan")

        error = matching_error(errors, "cover_background_final_collision")
        self.assertEqual(
            "assets[0].title.background_artifact_path", error["path"]
        )

    def test_x_article_integration_requires_wide_but_not_square_crop_check(
        self,
    ) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]
        data["assets"][0]["title"]["square_crop_checked"] = False
        for relative_path in (
            data["assets"][0]["artifact_path"],
            data["assets"][0]["title"]["editable_source_path"],
            data["assets"][0]["title"]["background_artifact_path"],
        ):
            path = self.root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b"verified")

        errors = validate_manifest(data, self.manifest_path, "integration")

        crop_errors = [
            error for error in errors if error["code"] == "cover_title_crop_not_checked"
        ]
        self.assertEqual(
            ["assets[0].title.wide_crop_checked"],
            [error["path"] for error in crop_errors],
        )

        data["assets"][0]["title"]["wide_crop_checked"] = True
        self.assertEqual([], validate_manifest(data, self.manifest_path, "integration"))

    def test_integration_requires_existing_cover_background(self) -> None:
        data = make_wechat_cover_manifest()
        data["platforms"] = ["x-article"]
        data["assets"][0]["title"]["wide_crop_checked"] = True
        for relative_path in (
            data["assets"][0]["artifact_path"],
            data["assets"][0]["title"]["editable_source_path"],
        ):
            path = self.root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b"verified")

        errors = validate_manifest(data, self.manifest_path, "integration")

        error = matching_error(errors, "cover_background_missing")
        self.assertEqual(
            "assets[0].title.background_artifact_path", error["path"]
        )


class ValidateManifestV2Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.skill_root = self.root / "skill"
        self.manifest_path = self.root / "visual-plan.json"
        profile_root = self.skill_root / "assets" / "style-anchors" / "fixture-profile"
        protocol_root = self.skill_root / "references" / "styles"
        profile_root.mkdir(parents=True)
        protocol_root.mkdir(parents=True)
        self.protocol_path = protocol_root / "01-fixture-profile.md"
        self.golden_path = profile_root / "golden-set.json"
        self.protocol_path.write_text("# Fixture Protocol\n", encoding="utf-8")
        self.golden_path.write_text(
            json.dumps({
                "golden_set_version": 1,
                "profile_id": "fixture-profile",
                "protocol_version": 2,
                "status": "approved",
                "user_approval": {"status": "approved", "revision_notes": []},
                "assets": [
                    {"id": "fixture-cover", "role": "cover"},
                    {"id": "fixture-concept", "role": "concept"},
                    {"id": "fixture-diagram", "role": "diagram"},
                ],
            }),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _sha(self, path: Path) -> str:
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def make_v2_manifest(
        self, renderer: str = "imagegen", phase_ready: bool = False
    ) -> dict:
        data = make_manifest()
        data["manifest_version"] = 2
        asset = data["assets"][0]
        if renderer == "deterministic-diagram":
            asset["role"] = "process"
            asset["renderer"] = renderer
            asset["prompt"] = None
            asset["diagram_spec"] = {
                "nodes": [], "edges": [], "blocked_unconfirmed_edges": []
            }
            asset["editable_source_path"] = "visual-renders/process.svg"
        asset["style_validation"] = {
            "status": "passed" if phase_ready else "planned",
            "golden_reference_ids": ["fixture-diagram"],
            "required_traits_passed": phase_ready,
            "forbidden_traits_found": [],
            "theme_bleed": False,
            "series_continuity": "passed" if phase_ready else "planned",
            "review_notes": None,
        }
        data["style"] = {
            "profile_id": "fixture-profile",
            "profile_version": 2,
            "protocol_path": "references/styles/01-fixture-profile.md",
            "protocol_sha256": self._sha(self.protocol_path),
            "golden_set_path": "assets/style-anchors/fixture-profile/golden-set.json",
            "golden_set_sha256": self._sha(self.golden_path),
            "golden_reference_ids": [
                "fixture-cover", "fixture-concept", "fixture-diagram"
            ],
            "publication_theme": "green",
            "theme_override_policy": "title-layer-only",
            "approved_overrides": [],
            "article_reference_paths": [],
            "article_style_anchor_asset_id": asset["id"],
        }
        data["approvals"]["article_style_anchor"] = (
            "approved" if renderer == "imagegen" else "not_required"
        )
        if phase_ready:
            for relative in (asset["artifact_path"], asset.get("editable_source_path")):
                if relative:
                    path = self.root / relative
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_bytes(b"verified")
        return data

    def enable_v3_manifest(self, data: dict) -> None:
        profile_root = self.skill_root / "assets" / "style-anchors" / "fixture-profile"
        pack_paths = {
            "visual_dna": profile_root / "visual-dna.json",
            "role_contracts": profile_root / "role-contracts.json",
            "reference_matrix": profile_root / "reference-matrix.json",
        }
        for name, path in pack_paths.items():
            path.write_text(json.dumps({"kind": name}), encoding="utf-8")

        prompt_root = self.root / "visual-prompts"
        prompt_root.mkdir(parents=True, exist_ok=True)
        prompt_ir = prompt_root / "asset-concept.prompt-ir.json"
        compiled = prompt_root / "asset-concept.gpt-image.prompt.md"
        prompt_ir.write_text(json.dumps({"prompt": "ir"}), encoding="utf-8")
        compiled.write_text("[OUTPUT CONTRACT]\nfixture\n", encoding="utf-8")

        style = data["style"]
        style.update({
            "style_pack_version": 3,
            "visual_dna_path": (
                "assets/style-anchors/fixture-profile/visual-dna.json"
            ),
            "visual_dna_sha256": self._sha(pack_paths["visual_dna"]),
            "role_contracts_path": (
                "assets/style-anchors/fixture-profile/role-contracts.json"
            ),
            "role_contracts_sha256": self._sha(pack_paths["role_contracts"]),
            "reference_matrix_path": (
                "assets/style-anchors/fixture-profile/reference-matrix.json"
            ),
            "reference_matrix_sha256": self._sha(pack_paths["reference_matrix"]),
            "adapter_id": "gpt-image",
            "adapter_version": 1,
            "prompt_ir_path": "visual-prompts/asset-concept.prompt-ir.json",
            "prompt_ir_sha256": self._sha(prompt_ir),
            "compiled_prompt_path": (
                "visual-prompts/asset-concept.gpt-image.prompt.md"
            ),
            "compiled_prompt_sha256": self._sha(compiled),
        })
        data["assets"][0]["style_validation"]["drift_codes"] = []

    def assert_error(
        self, data: dict, code: str, phase: str = "plan"
    ) -> None:
        errors = validate_manifest(
            data, self.manifest_path, phase, skill_root=self.skill_root
        )
        self.assertTrue(any(error["code"] == code for error in errors), errors)

    def test_v1_fixture_remains_valid(self) -> None:
        self.assertEqual([], validate_manifest(make_manifest(), self.manifest_path, "plan"))

    def test_v2_imagegen_requires_approved_article_style_anchor(self) -> None:
        data = self.make_v2_manifest(renderer="imagegen")
        data["approvals"]["article_style_anchor"] = "not_required"
        self.assert_error(data, "article_style_anchor_required")

    def test_v2_single_deterministic_asset_may_skip_anchor(self) -> None:
        data = self.make_v2_manifest(renderer="deterministic-diagram")
        data["style"]["article_style_anchor_asset_id"] = None
        self.assertEqual(
            [],
            validate_manifest(
                data, self.manifest_path, "plan", skill_root=self.skill_root
            ),
        )

    def test_v2_rejects_theme_override_outside_policy(self) -> None:
        data = self.make_v2_manifest()
        data["style"]["approved_overrides"] = ["palette.primary"]
        self.assert_error(data, "theme_override_not_allowed")

    def test_v2_rejects_protocol_or_golden_hash_drift(self) -> None:
        data = self.make_v2_manifest()
        data["style"]["golden_set_sha256"] = "0" * 64
        self.assert_error(data, "golden_set_hash_mismatch")

    def test_v2_integration_requires_passed_style_validation(self) -> None:
        data = self.make_v2_manifest(phase_ready=True)
        data["assets"][0]["style_validation"]["status"] = "pending"
        self.assert_error(data, "style_validation_not_passed", phase="integration")

    def test_v2_rejects_forbidden_traits_and_theme_bleed(self) -> None:
        data = self.make_v2_manifest(phase_ready=True)
        validation = data["assets"][0]["style_validation"]
        validation["forbidden_traits_found"] = ["corporate-card-grid"]
        validation["theme_bleed"] = True
        errors = validate_manifest(
            data, self.manifest_path, "integration", skill_root=self.skill_root
        )
        self.assertTrue(any(error["code"] == "forbidden_style_trait" for error in errors))
        self.assertTrue(any(error["code"] == "style_theme_bleed" for error in errors))

    def test_v2_anchor_asset_id_must_exist(self) -> None:
        data = self.make_v2_manifest()
        data["style"]["article_style_anchor_asset_id"] = "missing-asset"
        self.assert_error(data, "unknown_style_anchor_asset")

    def test_v3_style_requires_pack_and_prompt_traceability(self) -> None:
        data = self.make_v2_manifest()
        data["style"]["style_pack_version"] = 3
        self.assert_error(data, "missing_style_pack_field")

    def test_legacy_v2_without_style_pack_remains_valid(self) -> None:
        data = self.make_v2_manifest()
        self.assertEqual(
            [],
            validate_manifest(
                data, self.manifest_path, "plan", skill_root=self.skill_root
            ),
        )

    def test_valid_v3_traceability_passes(self) -> None:
        data = self.make_v2_manifest()
        self.enable_v3_manifest(data)
        self.assertEqual(
            [],
            validate_manifest(
                data, self.manifest_path, "plan", skill_root=self.skill_root
            ),
        )

    def test_v3_rejects_unknown_drift_code(self) -> None:
        data = self.make_v2_manifest()
        self.enable_v3_manifest(data)
        data["assets"][0]["style_validation"]["drift_codes"] = ["FREEFORM_DRIFT"]
        self.assert_error(data, "invalid_drift_code")


if __name__ == "__main__":
    unittest.main()
