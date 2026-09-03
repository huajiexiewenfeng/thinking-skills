from __future__ import annotations

import copy
import json
import re
import sys
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from apply_visual_plan import _render_markdown, anchor_context_sha256


class PlacementExampleTests(unittest.TestCase):
    def examples(self) -> list[dict]:
        schema = (SCRIPT_DIR.parent / "references" / "manifest-schema.md").read_text(
            encoding="utf-8"
        )
        return [
            value
            for block in re.findall(r"\x60\x60\x60json\n(.*?)\n\x60\x60\x60", schema, re.DOTALL)
            if isinstance(value := json.loads(block), dict)
            and "manifest_version" in value
            and "assets" in value
        ]

    def render_example(self, example: dict) -> tuple[str, str, list[dict]]:
        assets = copy.deepcopy(example["assets"])
        source = "# Placement example\n\n"
        for asset in assets:
            source += asset["anchor"]["heading"] + "\n\n"
            source += f"Body paragraph for {asset['id']}.\n\n"
        for asset in assets:
            anchor = asset["anchor"]
            anchor["context_sha256"] = anchor_context_sha256(
                source, anchor["heading"], anchor["occurrence"]
            )
        return source, _render_markdown(source, assets), assets

    def test_default_manifest_examples_put_images_directly_after_headings(self) -> None:
        examples = self.examples()
        self.assertGreaterEqual(len(examples), 2)
        for example in examples:
            with self.subTest(version=example["manifest_version"]):
                _, output, assets = self.render_example(example)
                for asset in assets:
                    heading = asset["anchor"]["heading"]
                    marker = f"<!-- article-visual:start {asset['id']} -->"
                    # Check actual rendered order, not a spelling match in guidance.
                    self.assertIn(f"{heading}\n\n{marker}\n![", output)
                    self.assertLess(
                        output.index(marker),
                        output.index(f"Body paragraph for {asset['id']}."),
                    )

    def test_explicit_section_end_remains_supported(self) -> None:
        example = copy.deepcopy(self.examples()[0])
        example["assets"][0]["anchor"]["placement"] = "section_end"
        _, output, assets = self.render_example(example)
        asset = assets[0]
        self.assertLess(
            output.index(f"Body paragraph for {asset['id']}."),
            output.index(f"<!-- article-visual:start {asset['id']} -->"),
        )


if __name__ == "__main__":
    unittest.main()
