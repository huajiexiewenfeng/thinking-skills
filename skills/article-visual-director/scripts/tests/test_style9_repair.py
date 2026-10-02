import copy
import json
import os
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

ROOT = Path(os.environ.get('VISUAL_SKILL_ROOT', str(Path(__file__).resolve().parents[2])))
sys.path.insert(0, str(ROOT / 'scripts'))
from compile_image_prompt import compile_prompt_ir, lint_prompt_ir, PromptCompileError
from list_style_previews import collect_style_previews
import list_style_previews


class RepairTests(unittest.TestCase):
    def request(self):
        return json.loads((ROOT.parents[1] / 'evals/style-pack-probes/09-dense-technical-infographic.json').read_text(encoding='utf-8'))['probes'][0]['request']

    def test_preview_distinguishes_reference_from_qualification(self):
        original = list_style_previews._load_json_object
        def pending_metadata(path):
            value = original(path)
            if value and value.get('profile_id') == 'dense-technical-infographic' and 'qualification' in value:
                value = copy.deepcopy(value)
                value['qualification']['cross_topic_probe_status'] = 'pending'
            return value
        with patch.object(list_style_previews, '_load_json_object', side_effect=pending_metadata):
            row = next(r for r in collect_style_previews(ROOT) if r['ordinal'] == 9)
        self.assertEqual('available', row['status'])
        self.assertEqual('pending', row['qualification_status'])
        self.assertIn('cross_topic_probe_status', row['qualification_pending'])
        self.assertFalse(row['release_validation_performed'])

    def test_native_text_is_closed_inventory_without_mutating_request(self):
        request = self.request()
        before = copy.deepcopy(request)
        ir = compile_prompt_ir(ROOT, request)
        self.assertEqual(before, request)
        self.assertEqual('closed', ir['text_policy']['inventory_mode'])
        self.assertTrue(ir['text_policy']['rendering_rules'])
        self.assertEqual(request['text_policy']['exact_text'], ir['text_policy']['exact_text'])
        ir['text_policy']['inventory_mode'] = 'open'
        self.assertTrue(any(e['code'] == 'TEXT_POLICY_VIOLATION' for e in lint_prompt_ir(ir)))

    def test_non_diagram_invalid_graph_is_rejected(self):
        request = self.request()
        request['semantics']['frozen_graph'] = {'nodes': ['known'], 'edges': [{'from': 'known', 'to': 'invented'}]}
        with self.assertRaisesRegex(PromptCompileError, 'SEMANTIC_TOPOLOGY_DRIFT'):
            compile_prompt_ir(ROOT, request)


if __name__ == '__main__':
    unittest.main()
