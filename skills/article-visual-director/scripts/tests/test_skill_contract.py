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


class SkillContractTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
