from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from apply_visual_plan import (  # noqa: E402
    ApplyVisualPlanError,
    anchor_context_sha256,
    apply_visual_plan,
)


ARTICLE_TEXT = (
    "---\r\n"
    "title: Runtime Demo\r\n"
    "---\r\n"
    "\r\n"
    "# Runtime\r\n"
    "\r\n"
    "![existing](keep.png)\r\n"
    "\r\n"
    "## Runtime Loop\r\n"
    "\r\n"
    "Before.\r\n"
    "\r\n"
    "```python\r\n"
    "## not a heading\r\n"
    "print(\"ok\")\r\n"
    "```\r\n"
    "\r\n"
    "After.\r\n"
    "\r\n"
    "## Next\r\n"
    "\r\n"
    "Done.\r\n"
)


class ApplyVisualPlanTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.source_path = self.root / "article.md"
        self.source_bytes = b"\xef\xbb\xbf" + ARTICLE_TEXT.encode("utf-8")
        self.source_path.write_bytes(self.source_bytes)

        render_dir = self.root / "renders"
        render_dir.mkdir()
        (render_dir / "cover.png").write_bytes(b"cover-image")
        (render_dir / "concept.png").write_bytes(b"concept-image")

        self.manifest_path = self.root / "visual-manifest.json"
        self.manifest = {
            "manifest_version": 1,
            "source": {
                "path": "article.md",
                "sha256": hashlib.sha256(self.source_bytes).hexdigest(),
                "encoding": "utf-8-sig",
                "line_ending": "crlf",
            },
            "article_slug": "runtime-demo",
            "platforms": ["csdn", "wechat"],
            "style": {
                "profile_id": "technical-editorial-minimal",
                "fingerprint": "ink blue cyan clean grid",
            },
            "approvals": {"plan": "approved", "style_anchor": "not_required"},
            "assets": [
                self._asset(
                    asset_id="asset-cover",
                    heading="# Runtime",
                    placement="after_heading",
                    artifact_path="renders/cover.png",
                    markdown_path="assets/runtime-demo/cover.png",
                    alt="Runtime article cover",
                ),
                self._asset(
                    asset_id="asset-runtime-loop",
                    heading="## Runtime Loop",
                    placement="section_end",
                    artifact_path="renders/concept.png",
                    markdown_path="assets/runtime-demo/runtime-loop.png",
                    alt="Runtime loop concept",
                    caption="Runtime keeps execution inside explicit boundaries.",
                ),
            ],
        }
        self._write_manifest()

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def _asset(
        self,
        *,
        asset_id: str,
        heading: str,
        placement: str,
        artifact_path: str,
        markdown_path: str,
        alt: str,
        caption: str | None = None,
    ) -> dict:
        return {
            "id": asset_id,
            "role": "cover" if "cover" in asset_id else "concept",
            "renderer": "imagegen",
            "anchor": {
                "heading": heading,
                "occurrence": 1,
                "placement": placement,
                "context_sha256": anchor_context_sha256(ARTICLE_TEXT, heading, 1),
            },
            "prompt": f"Generate {alt}",
            "approval": "approved",
            "artifact_path": artifact_path,
            "markdown_path": markdown_path,
            "alt": alt,
            "caption": caption,
            "generation_status": "complete",
            "validation_status": "passed",
            "insertion_status": "pending",
        }

    def _write_manifest(self) -> None:
        self.manifest_path.write_text(
            json.dumps(self.manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def test_preserves_markdown_bytes_and_inserts_at_verified_anchors(self) -> None:
        result = apply_visual_plan(self.manifest_path)

        output_path = self.root / "article-illustrated.md"
        output_bytes = output_path.read_bytes()
        output_text = output_bytes.decode("utf-8-sig")
        self.assertEqual(output_path, result["output_path"])
        self.assertTrue(output_bytes.startswith(b"\xef\xbb\xbf"))
        self.assertNotIn(b"\n", output_bytes.replace(b"\r\n", b""))
        self.assertTrue(output_text.startswith("---\r\ntitle: Runtime Demo\r\n---"))
        self.assertIn('```python\r\n## not a heading\r\nprint("ok")\r\n```', output_text)
        self.assertEqual(1, output_text.count("![existing](keep.png)"))
        self.assertLess(
            output_text.index("<!-- article-visual:asset-cover:start -->"),
            output_text.index("![existing](keep.png)"),
        )
        self.assertLess(
            output_text.index("<!-- article-visual:asset-runtime-loop:start -->"),
            output_text.index("## Next"),
        )
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())
        self.assertEqual(
            b"cover-image",
            (self.root / "assets/runtime-demo/cover.png").read_bytes(),
        )
        updated_manifest = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        self.assertTrue(
            all(asset["insertion_status"] == "inserted" for asset in updated_manifest["assets"])
        )

    def test_repeated_execution_is_idempotent(self) -> None:
        first = apply_visual_plan(self.manifest_path)
        first_bytes = first["output_path"].read_bytes()

        second = apply_visual_plan(self.manifest_path)
        second_bytes = second["output_path"].read_bytes()

        self.assertFalse(second["changed"])
        self.assertEqual(first_bytes, second_bytes)
        self.assertEqual(1, second_bytes.count(b"article-visual:asset-cover:start"))
        self.assertEqual(
            1, second_bytes.count(b"article-visual:asset-runtime-loop:start")
        )

    def test_source_hash_mismatch_fails_closed(self) -> None:
        self.manifest["source"]["sha256"] = "0" * 64
        self._write_manifest()

        with self.assertRaisesRegex(ApplyVisualPlanError, "source_hash_mismatch"):
            apply_visual_plan(self.manifest_path)

    def test_anchor_context_mismatch_fails_closed(self) -> None:
        self.manifest["assets"][0]["anchor"]["context_sha256"] = "0" * 64
        self._write_manifest()

        with self.assertRaisesRegex(ApplyVisualPlanError, "anchor_context_mismatch"):
            apply_visual_plan(self.manifest_path)

    def test_refuses_to_overwrite_source(self) -> None:
        with self.assertRaisesRegex(ApplyVisualPlanError, "source_output_collision"):
            apply_visual_plan(self.manifest_path, output_path=self.source_path)


if __name__ == "__main__":
    unittest.main()
