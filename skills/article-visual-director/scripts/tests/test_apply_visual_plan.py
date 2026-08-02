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
    apply_plan,
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
        self._set_source(ARTICLE_TEXT)

        render_dir = self.root / "renders"
        render_dir.mkdir()
        (render_dir / "cover.png").write_bytes(b"\x89")
        (render_dir / "concept.png").write_bytes(b"\x89")

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
            "outputs": {
                "illustrated_markdown": "article-illustrated.md",
                "actual_illustrated_markdown": None,
                "asset_directory": "assets/runtime-demo",
            },
            "style": {
                "profile_id": "technical-editorial-minimal",
                "fingerprint": "ink blue cyan clean grid",
            },
            "approvals": {"plan": "approved", "style_anchor": "not_required"},
            "integration": {"status": "pending", "verification_status": "pending"},
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

    def _set_source(self, text: str) -> None:
        self.article_text = text
        self.source_bytes = b"\xef\xbb\xbf" + text.encode("utf-8")
        self.source_path.write_bytes(self.source_bytes)

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
        occurrence: int = 1,
    ) -> dict:
        return {
            "id": asset_id,
            "role": "cover" if "cover" in asset_id else "concept",
            "reader_takeaway": alt,
            "visual_purpose": "Clarify the article's visual argument.",
            "renderer": "imagegen",
            "output_format": "png",
            "dimensions": {"width": 1600, "height": 900},
            "aspect_ratio": "16:9",
            "safe_area": "Keep essential content outside the outer 8 percent.",
            "anchor": {
                "heading": heading,
                "occurrence": occurrence,
                "placement": placement,
                "context_sha256": anchor_context_sha256(
                    self.article_text, heading, occurrence
                ),
            },
            "prompt": f"Generate {alt}",
            "diagram_spec": None,
            "approval": "approved",
            "editable_source_path": None,
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

    def test_inserts_validated_asset_at_section_end_without_touching_code_fence(
        self,
    ) -> None:
        result = apply_visual_plan(self.manifest_path)
        output_text = result["output_path"].read_bytes().decode("utf-8-sig")

        marker = "<!-- article-visual:start asset-runtime-loop -->"
        self.assertEqual("created", result["status"])
        self.assertLess(output_text.index(marker), output_text.index("## Next"))
        self.assertIn('```python\r\n## not a heading\r\nprint("ok")\r\n```', output_text)
        self.assertEqual(1, output_text.count(marker))
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_duplicate_heading_uses_one_based_occurrence(self) -> None:
        duplicate_text = (
            "# Root\r\n\r\n## Repeat\r\nFirst.\r\n\r\n"
            "## Repeat\r\nSecond.\r\n\r\n## Tail\r\nDone.\r\n"
        )
        self._set_source(duplicate_text)
        self.manifest["source"]["sha256"] = hashlib.sha256(self.source_bytes).hexdigest()
        self.manifest["assets"] = [
            self._asset(
                asset_id="asset-second-repeat",
                heading="## Repeat",
                occurrence=2,
                placement="section_end",
                artifact_path="renders/concept.png",
                markdown_path="assets/runtime-demo/second-repeat.png",
                alt="Second repeated section",
            )
        ]
        self._write_manifest()

        result = apply_visual_plan(self.manifest_path)
        output_text = result["output_path"].read_text(encoding="utf-8-sig")

        second_heading = output_text.find("## Repeat", output_text.find("## Repeat") + 1)
        marker = output_text.index("<!-- article-visual:start asset-second-repeat -->")
        self.assertGreater(marker, second_heading)
        self.assertLess(marker, output_text.index("## Tail"))
        self.assertEqual(
            1, output_text.count("article-visual:start asset-second-repeat")
        )
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_source_digest_mismatch_blocks_write(self) -> None:
        self.manifest["source"]["sha256"] = "0" * 64
        self._write_manifest()

        with self.assertRaises(ApplyVisualPlanError) as raised:
            apply_visual_plan(self.manifest_path)

        self.assertEqual("source_hash_mismatch", raised.exception.code)
        self.assertFalse((self.root / "article-illustrated.md").exists())
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_second_application_is_idempotent(self) -> None:
        first = apply_visual_plan(self.manifest_path)
        first_bytes = first["output_path"].read_bytes()

        second = apply_plan(
            self.manifest_path, first["output_path"], first["output_path"]
        )

        self.assertEqual("unchanged", second["status"])
        self.assertEqual(first["output_path"], second["output_path"])
        self.assertEqual(first_bytes, second["output_path"].read_bytes())
        self.assertEqual(1, first_bytes.count(b"article-visual:start asset-cover"))
        self.assertEqual(
            1, first_bytes.count(b"article-visual:start asset-runtime-loop")
        )
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_utf8_bom_and_crlf_are_preserved(self) -> None:
        result = apply_visual_plan(self.manifest_path)
        output_bytes = result["output_path"].read_bytes()
        output_text = output_bytes.decode("utf-8-sig")

        self.assertTrue(output_bytes.startswith(b"\xef\xbb\xbf"))
        self.assertNotIn(b"\n", output_bytes.replace(b"\r\n", b""))
        self.assertTrue(output_text.startswith("---\r\ntitle: Runtime Demo\r\n---"))
        self.assertEqual(1, output_text.count("![existing](keep.png)"))
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_existing_output_gets_versioned_sibling(self) -> None:
        requested_output = self.root / "article-illustrated.md"
        requested_output.write_text("user-owned output", encoding="utf-8")

        result = apply_visual_plan(self.manifest_path)

        self.assertEqual("created", result["status"])
        self.assertEqual(self.root / "article-illustrated-v2.md", result["output_path"])
        self.assertEqual("user-owned output", requested_output.read_text(encoding="utf-8"))
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_repeated_default_application_reuses_versioned_sibling(self) -> None:
        requested_output = self.root / "article-illustrated.md"
        requested_output.write_text("user-owned output", encoding="utf-8")

        first = apply_visual_plan(self.manifest_path)
        second = apply_visual_plan(self.manifest_path)

        self.assertEqual(self.root / "article-illustrated-v2.md", first["output_path"])
        self.assertEqual("unchanged", second["status"])
        self.assertEqual(first["output_path"], second["output_path"])
        self.assertFalse((self.root / "article-illustrated-v3.md").exists())
        persisted = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(
            "article-illustrated-v2.md",
            persisted["outputs"]["actual_illustrated_markdown"],
        )

    def test_same_source_and_output_requires_explicit_flag(self) -> None:
        with self.assertRaises(ApplyVisualPlanError) as raised:
            apply_plan(self.manifest_path, self.source_path, self.source_path)
        self.assertEqual("source_output_collision", raised.exception.code)
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

        result = apply_plan(
            self.manifest_path,
            self.source_path,
            self.source_path,
            allow_source_overwrite=True,
        )
        self.assertEqual("created", result["status"])
        self.assertEqual(self.source_path, result["output_path"])
        self.assertIn(
            b"article-visual:start asset-cover", self.source_path.read_bytes()
        )

    def test_partial_existing_markers_fail_closed_before_digest_check(self) -> None:
        partial = (
            ARTICLE_TEXT
            + "\r\n<!-- article-visual:start asset-cover -->\r\n"
            + "![Runtime article cover](assets/runtime-demo/cover.png)\r\n"
            + "<!-- article-visual:end asset-cover -->\r\n"
        )
        partial_path = self.root / "article-partial.md"
        partial_path.write_bytes(b"\xef\xbb\xbf" + partial.encode("utf-8"))

        with self.assertRaises(ApplyVisualPlanError) as raised:
            apply_plan(self.manifest_path, partial_path, partial_path)

        self.assertEqual("partial_integration", raised.exception.code)

    def test_interleaved_marker_pairs_fail_closed(self) -> None:
        interleaved = ARTICLE_TEXT + (
            "\r\n<!-- article-visual:start asset-cover -->"
            "\r\n<!-- article-visual:start asset-runtime-loop -->"
            "\r\n<!-- article-visual:end asset-cover -->"
            "\r\n<!-- article-visual:end asset-runtime-loop -->\r\n"
        )
        interleaved_path = self.root / "article-interleaved.md"
        interleaved_path.write_bytes(b"\xef\xbb\xbf" + interleaved.encode("utf-8"))

        with self.assertRaises(ApplyVisualPlanError) as raised:
            apply_plan(self.manifest_path, interleaved_path, interleaved_path)

        self.assertEqual("partial_integration", raised.exception.code)

    def test_anchor_context_mismatch_fails_closed(self) -> None:
        self.manifest["assets"][0]["anchor"]["context_sha256"] = "0" * 64
        self._write_manifest()

        with self.assertRaises(ApplyVisualPlanError) as raised:
            apply_visual_plan(self.manifest_path)

        self.assertEqual("anchor_context_mismatch", raised.exception.code)

    def test_asset_destination_cannot_collide_with_protected_files(self) -> None:
        protected_paths = (
            "article.md",
            "visual-manifest.json",
            "article-illustrated.md",
            "renders/cover.png",
        )
        for markdown_path in protected_paths:
            with self.subTest(markdown_path=markdown_path):
                self.manifest["assets"][0]["markdown_path"] = markdown_path
                self._write_manifest()
                with self.assertRaises(ApplyVisualPlanError) as raised:
                    apply_visual_plan(self.manifest_path)
                self.assertIn(
                    raised.exception.code,
                    {
                        "asset_destination_collision",
                        "artifact_path_collision",
                        "markdown_path_outside_asset_directory",
                    },
                )
                self.assertEqual(self.source_bytes, self.source_path.read_bytes())
                self.manifest["assets"][0]["markdown_path"] = (
                    "assets/runtime-demo/cover.png"
                )

    def test_duplicate_asset_destination_fails_before_any_write(self) -> None:
        self.manifest["assets"][1]["markdown_path"] = self.manifest["assets"][0][
            "markdown_path"
        ]
        self._write_manifest()

        with self.assertRaises(ApplyVisualPlanError) as raised:
            apply_visual_plan(self.manifest_path)

        self.assertIn(
            raised.exception.code,
            {"duplicate_asset_destination", "duplicate_markdown_path"},
        )
        self.assertFalse((self.root / "assets/runtime-demo/cover.png").exists())
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())

    def test_four_asset_end_to_end_fixture_is_idempotent(self) -> None:
        article = (
            "---\r\ntitle: Full Fixture\r\n---\r\n\r\n# Runtime\r\n\r\n"
            "## Loop\r\nFirst explanation.\r\n\r\n"
            "```text\r\n## Loop\r\nnot a heading\r\n```\r\n\r\n"
            "## Loop\r\nSecond explanation.\r\n\r\n"
            "## Architecture\r\nConfirmed boundary only.\r\n"
        )
        self._set_source(article)
        self.manifest["source"]["sha256"] = hashlib.sha256(self.source_bytes).hexdigest()
        self.manifest["approvals"]["style_anchor"] = "approved"
        for filename in ("cover-csdn.png", "cover-wechat.png", "concept.png", "architecture.png"):
            (self.root / "renders" / filename).write_bytes(b"\x89")
        source_dir = self.root / "sources"
        source_dir.mkdir()
        (source_dir / "architecture.svg").write_text("<svg></svg>", encoding="utf-8")

        assets = [
            self._asset(
                asset_id="asset-cover-csdn",
                heading="# Runtime",
                placement="after_heading",
                artifact_path="renders/cover-csdn.png",
                markdown_path="assets/runtime-demo/cover-csdn.png",
                alt="CSDN cover",
            ),
            self._asset(
                asset_id="asset-cover-wechat",
                heading="# Runtime",
                placement="after_heading",
                artifact_path="renders/cover-wechat.png",
                markdown_path="assets/runtime-demo/cover-wechat.png",
                alt="WeChat cover",
            ),
            self._asset(
                asset_id="asset-loop",
                heading="## Loop",
                occurrence=2,
                placement="section_end",
                artifact_path="renders/concept.png",
                markdown_path="assets/runtime-demo/concept.png",
                alt="Loop concept",
            ),
        ]
        architecture = self._asset(
            asset_id="asset-architecture",
            heading="## Architecture",
            placement="section_end",
            artifact_path="renders/architecture.png",
            markdown_path="assets/runtime-demo/architecture.png",
            alt="Architecture boundary",
        )
        architecture.update(
            {
                "role": "architecture",
                "renderer": "deterministic-diagram",
                "prompt": None,
                "diagram_spec": {
                    "nodes": [{"id": "runtime", "label": "Runtime"}],
                    "edges": [],
                    "blocked_unconfirmed_edges": [],
                },
                "editable_source_path": "sources/architecture.svg",
            }
        )
        assets.append(architecture)
        self.manifest["assets"] = assets
        self._write_manifest()

        from validate_manifest import validate_manifest

        self.assertEqual(
            [], validate_manifest(self.manifest, self.manifest_path, "integration")
        )
        first = apply_visual_plan(self.manifest_path)
        second = apply_plan(
            self.manifest_path, first["output_path"], first["output_path"]
        )
        illustrated = first["output_path"].read_bytes()

        self.assertEqual("created", first["status"])
        self.assertEqual("unchanged", second["status"])
        self.assertTrue(illustrated.startswith(b"\xef\xbb\xbf"))
        self.assertNotIn(b"\n", illustrated.replace(b"\r\n", b""))
        for asset in assets:
            self.assertEqual(
                1,
                illustrated.count(
                    f"article-visual:start {asset['id']}".encode("utf-8")
                ),
            )
            published = self.root / asset["markdown_path"]
            self.assertTrue(published.is_file())
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())
        persisted = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        self.assertEqual("complete", persisted["integration"]["status"])
        self.assertEqual("passed", persisted["integration"]["verification_status"])


if __name__ == "__main__":
    unittest.main()
