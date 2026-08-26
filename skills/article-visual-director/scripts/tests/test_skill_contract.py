from __future__ import annotations

import re
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[2]


class SkillContractTests(unittest.TestCase):
    def test_style_gate_and_catalog_expose_the_same_eight_profiles(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        catalog_text = (SKILL_ROOT / "references" / "style-catalog.md").read_text(
            encoding="utf-8"
        )

        menu_profiles = re.findall(
            r"^\d+\. \*\*([^（*]+)（[^）]+）\*\*", skill_text, flags=re.MULTILINE
        )
        catalog_profiles = re.findall(r"^## (.+)$", catalog_text, flags=re.MULTILINE)
        catalog_profiles.remove("Selection Heuristic")

        self.assertEqual(8, len(menu_profiles))
        self.assertEqual(8, len(catalog_profiles))
        self.assertEqual(
            {profile.split("（", 1)[0] for profile in menu_profiles},
            set(catalog_profiles),
        )
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
