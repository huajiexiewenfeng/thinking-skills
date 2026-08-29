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
            ],
            "references/adapters/gpt-image.md": [
                "same-role golden",
                "must_preserve",
                "must_not_copy",
            ],
        }
        for relative, phrases in required.items():
            with self.subTest(relative=relative):
                text = (SKILL_ROOT / relative).read_text(encoding="utf-8")
                for phrase in phrases:
                    self.assertIn(phrase, text)


if __name__ == "__main__":
    unittest.main()
