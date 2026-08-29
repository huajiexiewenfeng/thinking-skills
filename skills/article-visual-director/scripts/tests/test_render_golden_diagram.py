from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
SKILL_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

from render_golden_diagram import build_scene, render_png, render_svg  # noqa: E402


EXPECTED_LABELS = ["能力 10", "AI ×100", "输出 1000", "能力 1", "输出 100", "差距 900"]


class RenderGoldenDiagramTests(unittest.TestCase):
    def setUp(self) -> None:
        token_path = (
            SKILL_ROOT
            / "references"
            / "styles"
            / "08-handwritten-systems-explainer.tokens.json"
        )
        self.tokens = json.loads(token_path.read_text(encoding="utf-8"))

    def test_scene_and_svg_preserve_exact_benchmark_labels_and_style8_tokens(self) -> None:
        scene = build_scene(self.tokens)
        self.assertEqual((1600, 900), (scene["width"], scene["height"]))
        self.assertEqual(EXPECTED_LABELS, scene["labels"])

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "benchmark.svg"
            render_svg(scene, output)
            svg = output.read_text(encoding="utf-8")

        for label in EXPECTED_LABELS:
            self.assertIn(label, svg)
        for color in ("#171717", "#F59E0B", "#66AEE8", "#58B978"):
            self.assertIn(color, svg)
        self.assertIn('width="1600"', svg)
        self.assertIn('height="900"', svg)

    def test_png_is_1600_by_900_and_uses_external_temp_output(self) -> None:
        from PIL import Image

        scene = build_scene(self.tokens)
        font = Path(r"C:\Windows\Fonts\simkai.ttf")
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "benchmark.png"
            render_png(scene, output, font)
            with Image.open(output) as image:
                self.assertEqual((1600, 900), image.size)
                self.assertEqual("RGB", image.mode)


if __name__ == "__main__":
    unittest.main()
