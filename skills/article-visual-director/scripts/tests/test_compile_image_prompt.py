from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from compile_image_prompt import (  # noqa: E402
    REQUIRED_PROMPT_BLOCKS,
    PromptCompileError,
    compile_prompt_ir,
    lint_prompt_ir,
    render_gpt_image_prompt,
)


class CompileImagePromptTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.skill_root = Path(self.temp_dir.name)
        references = self.skill_root / "references"
        references.mkdir(parents=True)
        pack_root = self.skill_root / "assets" / "style-anchors" / "fixture"
        pack_root.mkdir(parents=True)

        registry = {
            "registry_version": 1,
            "profiles": [{
                "profile_id": "fixture-profile",
                "style_pack_version": 3,
                "visual_dna_path": "assets/style-anchors/fixture/visual-dna.json",
                "role_contracts_path": "assets/style-anchors/fixture/role-contracts.json",
                "reference_matrix_path": "assets/style-anchors/fixture/reference-matrix.json",
                "adapter_ids": ["gpt-image"],
            }],
        }
        (references / "style-registry.json").write_text(
            json.dumps(registry), encoding="utf-8"
        )
        self._write_json(pack_root / "visual-dna.json", {
            "profile_id": "fixture-profile",
            "style_pack_version": 3,
            "surface": {"background": "warm ivory paper"},
            "palette_roles": {"blue": "context and evidence"},
            "line_language": {"primary": "fine lively near-black ink"},
            "material_and_texture": {"primary": "subtle paper grain"},
            "geometry": {"nodes": "rounded teaching blocks"},
            "depth_and_camera": {"mode": "flat orthographic"},
            "typography": {"labels": "compact handwritten notes"},
            "density_and_spacing": {"density": "organized medium density"},
            "required_traits": ["warm ivory surface stays visibly present"],
            "forbidden_traits": ["no glossy three-dimensional interface cards"],
            "neighbor_boundaries": [{
                "profile_id": "neighbor",
                "difference": "fixture keeps organized systems annotations",
            }],
        })
        self._write_json(pack_root / "role-contracts.json", {
            "profile_id": "fixture-profile",
            "style_pack_version": 3,
            "roles": {
                role: {
                    "stability": "strict" if role == "diagram" else "family",
                    "must_preserve": ["preserve the registered role composition"],
                    "may_vary": ["article-specific subject placement may vary"],
                    "must_not_include": ["do not invent unsupported article facts"],
                    "acceptance_checks": ["the output remains in the visual family"],
                }
                for role in ("cover", "concept", "diagram")
            },
        })
        self._write_json(pack_root / "reference-matrix.json", {
            "profile_id": "fixture-profile",
            "style_pack_version": 3,
            "references": [
                {
                    "golden_asset_id": f"fixture-{role}",
                    "role": role,
                    "must_preserve": ["preserve line material and palette behavior"],
                    "may_vary": ["replace the example with article semantics"],
                    "must_not_copy": [
                        "labels", "numbers", "nodes", "topology", "example_story"
                    ],
                }
                for role in ("cover", "concept", "diagram")
            ],
        })

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _write_json(self, path: Path, data: dict) -> None:
        path.write_text(json.dumps(data), encoding="utf-8")

    def valid_request(self, role: str) -> dict:
        semantics = {
            "confirmed": ["A bounded query retrieves supporting evidence"],
            "simplifications": ["Show one representative evidence object"],
            "blocked": ["Do not imply that retrieval guarantees correctness"],
        }
        if role == "diagram":
            semantics["frozen_graph"] = {
                "nodes": ["query", "evidence", "answer"],
                "edges": [
                    {"from": "query", "to": "evidence"},
                    {"from": "evidence", "to": "answer"},
                ],
            }
        return {
            "profile_id": "fixture-profile",
            "asset_role": role,
            "objective": "Explain bounded retrieval without adding claims",
            "semantics": semantics,
            "composition": {
                "structure": "left-to-right explanatory sequence",
                "human_elements": "none" if role == "diagram" else "optional",
            },
            "text_policy": {
                "mode": "minimal labels",
                "exact_text": [],
                "deterministic_overlay": True,
            },
            "platform": {
                "name": "wechat",
                "aspect_ratio": "16:9",
                "occupancy": "main content within central 80 percent",
                "crop_rules": "protect every node from edge crops",
                "output_count": 1,
            },
            "golden_reference_ids": [f"fixture-{role}"],
            "article_anchor_reference_ids": [],
        }

    def test_compiler_renders_all_eight_blocks(self) -> None:
        prompt_ir = compile_prompt_ir(self.skill_root, self.valid_request("concept"))
        rendered = render_gpt_image_prompt(prompt_ir)
        for heading in REQUIRED_PROMPT_BLOCKS:
            self.assertIn(f"[{heading}]", rendered)

    def test_diagram_requires_frozen_semantic_graph(self) -> None:
        request = self.valid_request("diagram")
        request["semantics"].pop("frozen_graph")
        with self.assertRaisesRegex(PromptCompileError, "SEMANTIC_TOPOLOGY_DRIFT"):
            compile_prompt_ir(self.skill_root, request)

    def test_reference_contract_blocks_golden_content_copy(self) -> None:
        ir = compile_prompt_ir(self.skill_root, self.valid_request("cover"))
        blocked = set(ir["reference_contract"]["must_not_copy"])
        self.assertTrue(
            {"labels", "numbers", "nodes", "topology", "example_story"} <= blocked
        )

    def test_missing_same_role_golden_fails_closed(self) -> None:
        request = self.valid_request("concept")
        request["golden_reference_ids"] = []
        with self.assertRaisesRegex(PromptCompileError, "SERIES_CONTINUITY_DRIFT"):
            compile_prompt_ir(self.skill_root, request)

    def test_lint_reports_missing_required_block(self) -> None:
        ir = compile_prompt_ir(self.skill_root, self.valid_request("cover"))
        del ir["reference_contract"]
        errors = lint_prompt_ir(ir)
        self.assertTrue(any(error["code"] == "PROMPT_BLOCK_MISSING" for error in errors))

    def test_candidate_cover_can_bootstrap_without_cross_profile_reference(self) -> None:
        registry_path = self.skill_root / "references" / "style-registry.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        registry["profiles"][0]["style_pack_status"] = "candidate"
        registry_path.write_text(json.dumps(registry), encoding="utf-8")
        request = self.valid_request("cover")
        request["golden_reference_ids"] = []
        request["golden_production"] = {
            "stage": "cover",
            "bootstrap_references": [],
            "semantic_authority": False,
        }

        prompt_ir = compile_prompt_ir(self.skill_root, request)

        reference = prompt_ir["reference_contract"]
        self.assertTrue(reference["bootstrap_reference"])
        self.assertFalse(reference["semantic_authority"])
        self.assertEqual([], reference["required_references"])

    def test_approved_pack_cannot_skip_same_role_golden(self) -> None:
        request = self.valid_request("cover")
        request["golden_reference_ids"] = []
        request["golden_production"] = {
            "stage": "cover",
            "bootstrap_references": [],
            "semantic_authority": False,
        }

        with self.assertRaisesRegex(PromptCompileError, "SERIES_CONTINUITY_DRIFT"):
            compile_prompt_ir(self.skill_root, request)

    def test_candidate_bootstrap_reference_must_be_same_profile_and_approved(self) -> None:
        registry_path = self.skill_root / "references" / "style-registry.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        registry["profiles"][0]["style_pack_status"] = "candidate"
        registry_path.write_text(json.dumps(registry), encoding="utf-8")
        request = self.valid_request("concept")
        request["golden_reference_ids"] = []
        request["golden_production"] = {
            "stage": "concept",
            "bootstrap_references": [{
                "id": "other-cover",
                "profile_id": "other-profile",
                "role": "cover",
                "approval": "approved",
                "semantic_authority": False,
            }],
            "semantic_authority": False,
        }

        with self.assertRaisesRegex(PromptCompileError, "STYLE_IDENTITY_DRIFT"):
            compile_prompt_ir(self.skill_root, request)


class Style8ProbeSuiteTests(unittest.TestCase):
    def test_all_style_8_probes_compile_and_lint(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "08-handwritten-systems-explainer.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                request = probe["request"]
                self.assertNotIn("publication_theme", request)
                prompt_ir = compile_prompt_ir(skill_root, request)
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {
                        "labels",
                        "numbers",
                        "nodes",
                        "topology",
                        "example_story",
                    }
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )


class Style1ProbeSuiteTests(unittest.TestCase):
    def test_all_style_1_probes_compile_lint_and_discriminate_style_2(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "01-technical-editorial-minimal.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                prompt_ir = compile_prompt_ir(skill_root, probe["request"])
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {
                        "labels",
                        "numbers",
                        "nodes",
                        "topology",
                        "example_story",
                    }
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )

        discrimination = suite["neighbor_discrimination"]
        self.assertEqual(
            "white-green-editorial-minimal",
            discrimination["compare_profile_id"],
        )
        self.assertIn(
            "ink-blue",
            " ".join(discrimination["style_1_expected"]),
        )
        self.assertIn(
            "emerald-led",
            " ".join(discrimination["style_2_expected"]),
        )


class Style2ProbeSuiteTests(unittest.TestCase):
    def test_all_style_2_probes_compile_lint_and_discriminate_style_1(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "02-white-green-editorial-minimal.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                prompt_ir = compile_prompt_ir(skill_root, probe["request"])
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {"labels", "numbers", "nodes", "topology", "example_story"}
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )

        discrimination = suite["neighbor_discrimination"]
        self.assertEqual(
            "technical-editorial-minimal",
            discrimination["compare_profile_id"],
        )
        self.assertIn(
            "emerald-led",
            " ".join(discrimination["style_2_expected"]),
        )
        self.assertIn(
            "ink-blue",
            " ".join(discrimination["style_1_expected"]),
        )


class Style5ProbeSuiteTests(unittest.TestCase):
    def test_all_style_5_probes_compile_lint_and_discriminate_style_4(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "05-isometric-infrastructure.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                prompt_ir = compile_prompt_ir(skill_root, probe["request"])
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {"labels", "numbers", "nodes", "topology", "example_story"}
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )

        discrimination = suite["neighbor_discrimination"]
        self.assertEqual(
            "blueprint-linework",
            discrimination["compare_profile_id"],
        )
        self.assertIn(
            "fixed isometric",
            " ".join(discrimination["style_5_expected"]),
        )
        self.assertIn(
            "flat orthographic",
            " ".join(discrimination["style_4_expected"]),
        )


class Style3ProbeSuiteTests(unittest.TestCase):
    def test_all_style_3_probes_compile_lint_and_discriminate_style_5(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "03-neon-systems.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                prompt_ir = compile_prompt_ir(skill_root, probe["request"])
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {"labels", "numbers", "nodes", "topology", "example_story"}
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )

        discrimination = suite["neighbor_discrimination"]
        self.assertEqual(
            "isometric-infrastructure",
            discrimination["compare_profile_id"],
        )
        self.assertIn(
            "front-oblique",
            " ".join(discrimination["style_3_expected"]),
        )
        self.assertIn(
            "pale matte daylight",
            " ".join(discrimination["style_5_expected"]),
        )


class Style6ProbeSuiteTests(unittest.TestCase):
    def test_all_style_6_probes_compile_lint_and_discriminate_style_3(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "06-cinematic-conceptual.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                prompt_ir = compile_prompt_ir(skill_root, probe["request"])
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {"labels", "numbers", "nodes", "topology", "example_story"}
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )

        discrimination = suite["neighbor_discrimination"]
        self.assertEqual("neon-systems", discrimination["compare_profile_id"])
        self.assertIn(
            "layered teal-blue",
            " ".join(discrimination["style_6_expected"]),
        )
        self.assertIn(
            "neon circuitry",
            " ".join(discrimination["style_3_expected"]),
        )


class Style7ProbeSuiteTests(unittest.TestCase):
    def test_all_style_7_probes_compile_lint_and_discriminate_style_8(self) -> None:
        skill_root = SCRIPT_DIR.parent
        suite_path = (
            skill_root.parents[1]
            / "evals"
            / "style-pack-probes"
            / "07-soft-technical-sketch.json"
        )
        suite = json.loads(suite_path.read_text(encoding="utf-8"))

        self.assertEqual(3, len(suite["probes"]))
        self.assertEqual(
            {"cover", "concept", "diagram"},
            {probe["request"]["asset_role"] for probe in suite["probes"]},
        )
        for probe in suite["probes"]:
            with self.subTest(probe=probe["id"]):
                prompt_ir = compile_prompt_ir(skill_root, probe["request"])
                self.assertEqual([], lint_prompt_ir(prompt_ir))
                rendered = render_gpt_image_prompt(prompt_ir)
                for block in REQUIRED_PROMPT_BLOCKS:
                    self.assertEqual(1, rendered.count(f"[{block}]"))
                self.assertTrue(
                    {"labels", "numbers", "nodes", "topology", "example_story"}
                    <= set(prompt_ir["reference_contract"]["must_not_copy"])
                )

        discrimination = suite["neighbor_discrimination"]
        self.assertEqual(
            "handwritten-systems-explainer",
            discrimination["compare_profile_id"],
        )
        self.assertIn(
            "low-density",
            " ".join(discrimination["style_7_expected"]),
        )
        self.assertIn(
            "high-density",
            " ".join(discrimination["style_8_expected"]),
        )


if __name__ == "__main__":
    unittest.main()
