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


if __name__ == "__main__":
    unittest.main()
