from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[2]
EXPECTED_PROFILES = [
    (1, "technical-editorial-minimal", "Technical Editorial Minimal", "技术编辑简约"),
    (
        2,
        "white-green-editorial-minimal",
        "White-Green Editorial Minimal",
        "白底绿色编辑简约",
    ),
    (3, "neon-systems", "Neon Systems", "霓虹系统科技"),
    (4, "blueprint-linework", "Blueprint Linework", "蓝图线稿"),
    (
        5,
        "isometric-infrastructure",
        "Isometric Infrastructure",
        "等距基础设施",
    ),
    (6, "cinematic-conceptual", "Cinematic Conceptual", "电影感概念视觉"),
    (7, "soft-technical-sketch", "Soft Technical Sketch", "柔和技术手绘"),
    (
        8,
        "handwritten-systems-explainer",
        "Handwritten Systems Explainer",
        "手写系统解释图",
    ),
]
REQUIRED_PROTOCOL_HEADINGS = [
    "Identity",
    "Use When",
    "Do Not Use When",
    "Mode Boundary",
    "Required Visual Traits",
    "Allowed Variation",
    "Forbidden Traits",
    "Cover Contract",
    "Concept Contract",
    "Deterministic Diagram Contract",
    "Imagegen Prompt Contract",
    "Reference Use Contract",
    "Validation Rubric",
]
REQUIRED_TOKEN_KEYS = {
    "profile_id",
    "protocol_version",
    "surface",
    "palette",
    "line",
    "typography",
    "geometry",
    "depth",
    "texture",
    "spacing",
    "semantic_color_roles",
    "forbidden_traits",
}


class SkillContractTests(unittest.TestCase):
    def load_registry(self) -> dict:
        return json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )

    def load_tokens(self, profile_id: str) -> dict:
        registry = self.load_registry()
        item = next(
            profile for profile in registry["profiles"]
            if profile["profile_id"] == profile_id
        )
        return json.loads((SKILL_ROOT / item["tokens_path"]).read_text(encoding="utf-8"))

    def test_registry_locks_profile_identity_and_declared_paths(self) -> None:
        registry = json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )

        actual = [
            (item["ordinal"], item["profile_id"], item["name_en"], item["name_zh"])
            for item in registry["profiles"]
        ]
        self.assertEqual(1, registry["registry_version"])
        self.assertEqual(EXPECTED_PROFILES, actual)
        self.assertEqual(8, len({item["profile_id"] for item in registry["profiles"]}))

        for item in registry["profiles"]:
            ordinal = item["ordinal"]
            profile_id = item["profile_id"]
            prefix = f"references/styles/{ordinal:02d}-{profile_id}"
            self.assertEqual(f"{prefix}.md", item["protocol_path"])
            self.assertEqual(f"{prefix}.tokens.json", item["tokens_path"])
            self.assertEqual(
                f"assets/style-anchors/{profile_id}/golden-set.json",
                item["golden_set_path"],
            )

    def test_style_gate_and_catalog_expose_the_same_eight_profiles(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        catalog_text = (SKILL_ROOT / "references" / "style-catalog.md").read_text(
            encoding="utf-8"
        )

        menu_profiles = re.findall(
            r"^\d+\. \*\*([^（*]+)（[^）]+）\*\*", skill_text, flags=re.MULTILINE
        )
        catalog_profiles = re.findall(
            r"^\| \d+ \| ([^|]+?) \|", catalog_text, flags=re.MULTILINE
        )
        registry = json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )
        registry_profiles = [item["name_en"] for item in registry["profiles"]]

        self.assertEqual(8, len(menu_profiles))
        self.assertEqual(8, len(catalog_profiles))
        self.assertEqual(
            {profile.split("（", 1)[0] for profile in menu_profiles},
            set(catalog_profiles),
        )
        self.assertEqual(registry_profiles, catalog_profiles)
        self.assertIn("Handwritten Systems Explainer", catalog_profiles)

    def test_skill_routes_x_article_as_a_first_class_platform(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        platform_text = (
            SKILL_ROOT / "references" / "platform-profiles.md"
        ).read_text(encoding="utf-8")
        schema_text = (SKILL_ROOT / "references" / "manifest-schema.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("`x-article`", skill_text)
        self.assertIn("## X Articles", platform_text)
        self.assertIn("`x-article`", schema_text)

    def test_every_registered_protocol_and_token_file_satisfies_schema(self) -> None:
        for item in self.load_registry()["profiles"]:
            with self.subTest(profile_id=item["profile_id"]):
                protocol_path = SKILL_ROOT / item["protocol_path"]
                tokens_path = SKILL_ROOT / item["tokens_path"]
                self.assertTrue(protocol_path.is_file())
                self.assertTrue(tokens_path.is_file())

                protocol_text = protocol_path.read_text(encoding="utf-8")
                headings = re.findall(r"^## (.+)$", protocol_text, flags=re.MULTILINE)
                self.assertEqual(REQUIRED_PROTOCOL_HEADINGS, headings)

                tokens = json.loads(tokens_path.read_text(encoding="utf-8"))
                self.assertEqual(REQUIRED_TOKEN_KEYS, set(tokens))
                self.assertEqual(item["profile_id"], tokens["profile_id"])
                self.assertEqual(item["protocol_version"], tokens["protocol_version"])

    def test_soft_sketch_and_handwritten_explainer_remain_visibly_distinct(self) -> None:
        soft = self.load_tokens("soft-technical-sketch")
        handwritten = self.load_tokens("handwritten-systems-explainer")

        self.assertEqual("low", soft["palette"]["saturation"])
        self.assertEqual("controlled-variable", handwritten["palette"]["saturation"])
        self.assertEqual("fine-soft", soft["line"]["weight_class"])
        self.assertEqual("fine-variable", handwritten["line"]["weight_class"])
        self.assertEqual("high", handwritten["geometry"]["annotation_density"])
        self.assertEqual(
            "highlight-or-section-tab", handwritten["geometry"]["label_style"]
        )
        self.assertEqual("#6CAFE0", handwritten["palette"]["blue"])
        self.assertEqual("#65BD82", handwritten["palette"]["green"])
        self.assertEqual("#BFDDEE", handwritten["palette"]["pastel_blue"])
        self.assertEqual("#CFE8C7", handwritten["palette"]["pastel_green"])
        self.assertEqual("#D9C8EA", handwritten["palette"]["lavender"])
        self.assertEqual("#F4E59C", handwritten["palette"]["yellow"])
        self.assertNotEqual(
            soft["geometry"]["label_style"],
            handwritten["geometry"]["label_style"],
        )

        protocol = (
            SKILL_ROOT
            / "references"
            / "styles"
            / "08-handwritten-systems-explainer.md"
        ).read_text(encoding="utf-8")
        self.assertIn("miniature instructor figures", protocol)
        self.assertIn("handwritten formulas", protocol)
        self.assertIn("annotation-led technical whiteboard", protocol)
        self.assertIn("black section tabs", protocol)
        self.assertIn("pastel-to-medium", protocol)
        self.assertIn("Architecture diagrams contain no people", protocol)

    def test_workflow_loads_protocol_and_separates_style_responsibilities(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("load selected protocol and approved golden set", skill_text)
        self.assertIn("publication_theme", skill_text)
        self.assertIn("visual_profile", skill_text)
        self.assertIn("asset_semantics", skill_text)
        self.assertIn("any imagegen asset", skill_text)
        self.assertNotIn("when 3+ imagegen assets", skill_text)

    def test_golden_diagram_style_never_supplies_article_topology(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        protocol = (
            SKILL_ROOT
            / "references"
            / "styles"
            / "08-handwritten-systems-explainer.md"
        ).read_text(encoding="utf-8")

        self.assertIn("golden content is non-authoritative", skill_text)
        self.assertIn("article-specific semantic graph", skill_text)
        self.assertIn("Never infer article-specific nodes or edges", skill_text)
        self.assertIn("style-only reference", protocol)
        self.assertIn("golden topology is non-authoritative", protocol)
        self.assertIn("semantic graph", protocol)

    def test_style_pack_v3_reference_contracts_exist(self) -> None:
        required = {
            "references/style-pack-schema.md": [
                "visual-dna.json",
                "role-contracts.json",
                "reference-matrix.json",
            ],
            "references/prompt-ir-schema.md": [
                "OUTPUT CONTRACT",
                "ARTICLE SEMANTICS",
                "ROLE COMPOSITION",
                "VISUAL DNA",
                "REFERENCE CONTRACT",
                "TEXT POLICY",
                "NEGATIVE CONSTRAINTS",
                "ACCEPTANCE CHECK",
                "bootstrap_reference",
                "semantic_authority",
            ],
            "references/adapters/gpt-image.md": [
                "same-role golden",
                "must_preserve",
                "must_not_copy",
                "bootstrap candidate",
            ],
        }
        for relative, phrases in required.items():
            with self.subTest(relative=relative):
                text = (SKILL_ROOT / relative).read_text(encoding="utf-8")
                for phrase in phrases:
                    self.assertIn(phrase, text)

    def test_style_8_v3_preserves_approved_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "handwritten-systems-explainer"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in ("warm ivory", "fine lively", "pastel", "handwritten"):
            self.assertIn(phrase, joined)
        self.assertEqual("strict", roles["roles"]["diagram"]["stability"])
        self.assertEqual("family", roles["roles"]["cover"]["stability"])
        self.assertIn(
            "no people",
            " ".join(roles["roles"]["diagram"]["must_not_include"]),
        )
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_v3_workflow_compiles_and_fails_closed(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        cases_text = (
            SKILL_ROOT.parents[1] / "evals" / "article-visual-director-cases.md"
        ).read_text(encoding="utf-8")

        self.assertIn("scripts/compile_image_prompt.py", skill_text)
        self.assertIn("style_pack_not_qualified", skill_text)
        self.assertIn("never delete a failing block", skill_text)
        self.assertIn("PROMPT_BLOCK_MISSING", cases_text)
        self.assertIn("REFERENCE CONTRACT", cases_text)

    def test_style_1_v3_candidate_preserves_editorial_minimal_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "technical-editorial-minimal"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "off-white matte",
            "ink-blue",
            "uniform crisp",
            "negative space",
            "one warm",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["roles"]["cover"]["stability"])
        self.assertEqual("strict", roles["roles"]["diagram"]["stability"])
        self.assertIn("emerald", joined)
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_1_separates_editorial_2_5d_from_flat_diagram_depth(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "technical-editorial-minimal"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]

        self.assertIn("role-sensitive", dna["material_and_texture"]["depth"])
        self.assertIn("2.5D", " ".join(roles["cover"]["may_vary"]))
        self.assertIn("2.5D", " ".join(roles["concept"]["may_vary"]))
        self.assertIn("flat", " ".join(roles["diagram"]["must_preserve"]))
        self.assertIn("no perspective", " ".join(roles["diagram"]["must_not_include"]))

    def test_style_2_v3_candidate_preserves_green_led_wide_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "white-green-editorial-minimal"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "emerald-led",
            "both outer bands",
            "pale mint",
            "no leaves",
            "empty outer bands",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_7_v3_candidate_stays_soft_and_distinct_from_style_8(self) -> None:
        root = SKILL_ROOT / "assets" / "style-anchors" / "soft-technical-sketch"
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "warm watercolor paper",
            "fine soft",
            "translucent watercolor",
            "low density",
            "no black label tabs",
            "Style 8",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_4_v3_candidate_preserves_orthographic_blueprint_identity(self) -> None:
        root = SKILL_ROOT / "assets" / "style-anchors" / "blueprint-linework"
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "deep blueprint-blue",
            "orthographic",
            "uniform two-pixel",
            "single cyan",
            "no fake dimensions",
            "Style 5",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_5_v3_preserves_editorial_isometric_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "isometric-infrastructure"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "pale gray matte ground",
            "fixed 30-degree isometric",
            "substantial modules",
            "single amber",
            "shared shadow direction",
            "Style 4",
            "Style 3",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_6_v3_candidate_preserves_tactile_cinematic_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "cinematic-conceptual"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "fully opaque deep navy",
            "restrained 50 mm cinematic perspective",
            "matte mineral subject",
            "single motivated amber practical light",
            "very low symbolic density",
            "Style 3",
            "Style 5",
            "Style 1",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])


if __name__ == "__main__":
    unittest.main()
