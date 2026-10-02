from __future__ import annotations

import hashlib
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from apply_visual_plan import find_headings, anchor_context_sha256, ApplyVisualPlanError
import test_apply_visual_plan as fixtures


class HtmlHeadingTests(unittest.TestCase):
    def test_mixed_levels_preserve_exact_html(self):
        heading = '<h2 style="color:green">Build <em>loop</em></h2>'
        text = '# Root\n' + heading + '\nBody\n### Child\nDetail\n<h2>Next</h2>\nEnd'
        self.assertEqual([0, 1, 3, 5], [i for i, _ in find_headings(text.splitlines())])
        expected = heading + '\nBody\n### Child\nDetail'
        self.assertEqual(hashlib.sha256(expected.encode()).hexdigest(), anchor_context_sha256(text, heading, 1))

    def test_frontmatter_and_fenced_html_are_ignored(self):
        text = '---\n<h1>metadata</h1>\n---\n```html\n<h2>example</h2>\n```\n<h2>Real</h2>'
        self.assertEqual([(6, '<h2>Real</h2>')], find_headings(text.splitlines()))

    def test_duplicate_html_occurrence(self):
        text = '<h2>Same</h2>\nFirst\n<h2>Same</h2>\nSecond'
        expected = hashlib.sha256(b'<h2>Same</h2>\nSecond').hexdigest()
        self.assertEqual(expected, anchor_context_sha256(text, '<h2>Same</h2>', 2))

    def test_malformed_or_inline_html_not_anchors(self):
        text = '<h2>Mismatch</h3>\n<p><h2>Inline</h2></p>\n<h2>One</h2><h2>Two</h2>\n<h2>\nMultiline\n</h2>'
        self.assertEqual([], find_headings(text.splitlines()))


class HtmlIntegrationTests(unittest.TestCase):
    setUp = fixtures.ApplyVisualPlanTests.setUp
    tearDown = fixtures.ApplyVisualPlanTests.tearDown
    _set_source = fixtures.ApplyVisualPlanTests._set_source
    _asset = fixtures.ApplyVisualPlanTests._asset
    _write_manifest = fixtures.ApplyVisualPlanTests._write_manifest

    def test_html_after_heading_preserves_source_and_is_idempotent(self):
        title = '<h1 style="text-align:center">标题</h1>'
        heading = '<h2 style="color:#009b72">正文</h2>'
        text = title + '\r\n\r\n' + heading + '\r\n\r\n<p>内容</p>\r\n'
        self._set_source(text)
        self.manifest['source']['sha256'] = hashlib.sha256(self.source_bytes).hexdigest()
        self.manifest['assets'] = [self._asset(asset_id='asset-html', heading=heading, placement='after_heading', artifact_path='renders/concept.png', markdown_path='assets/runtime-demo/html.png', alt='说明')]
        self._write_manifest()
        from apply_visual_plan import apply_visual_plan
        result = apply_visual_plan(self.manifest_path)
        output = result['output_path'].read_bytes()
        decoded = output.decode('utf-8-sig')
        self.assertLess(decoded.index(heading), decoded.index('article-visual:start'))
        self.assertLess(decoded.index('article-visual:end'), decoded.index('<p>内容</p>'))
        self.assertTrue(output.startswith(b'\xef\xbb\xbf'))
        self.assertNotIn(b'\n', output.replace(b'\r\n', b''))
        self.assertEqual(self.source_bytes, self.source_path.read_bytes())
        again = apply_visual_plan(self.manifest_path)
        self.assertEqual('unchanged', again['status'])
        self.assertEqual(output, result['output_path'].read_bytes())


if __name__ == '__main__':
    unittest.main()
