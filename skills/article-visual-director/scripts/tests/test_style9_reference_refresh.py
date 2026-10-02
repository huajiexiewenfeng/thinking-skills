from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from compile_image_prompt import compile_prompt_ir, lint_prompt_ir
from validate_style_contract import validate_style_contract


ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / 'assets/style-anchors/dense-technical-infographic'


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


class Style9ReferenceRefreshTests(unittest.TestCase):
    def test_registered_identity_remains_compatible(self):
        profiles = read_json(ROOT / 'references/style-registry.json')['profiles']
        style = profiles[8]
        self.assertEqual(9, len(profiles))
        self.assertEqual('dense-technical-infographic', style['profile_id'])
        self.assertEqual('Technical Explainer Infographic', style['name_en'])
        self.assertEqual(3, style['protocol_version'])

    def test_compiler_carries_content_led_rules_without_old_template(self):
        suite = read_json(ROOT.parents[1] / 'evals/style-pack-probes/09-dense-technical-infographic.json')
        for probe in suite['probes']:
            with self.subTest(probe=probe['id']):
                result = compile_prompt_ir(ROOT, probe['request'])
                self.assertEqual([], lint_prompt_ir(result))
                dna = result['visual_dna']
                self.assertEqual('content-led', dna['geometry']['layout_policy'])
                self.assertEqual('optional-by-content', dna['geometry']['numbering'])
                self.assertEqual('optional-by-content', dna['geometry']['summary'])
                self.assertEqual('content-led-no-fixed-quota', dna['density_and_spacing']['occupancy'])
                self.assertEqual('per-diagram-consistent', dna['palette_roles']['mapping_policy'])
                self.assertEqual('line-icons-with-restrained-local-relief', dna['material_and_texture']['icon_mode'])
                rendered = json.dumps(result, ensure_ascii=False)
                self.assertNotIn('eighty-five to ninety-two', rendered)
                self.assertNotIn('no glass acrylic chrome 3D or isometric depth', rendered)
                self.assertNotIn('model_policy', result['output_contract'])
                self.assertNotIn('execution_policy', result['output_contract'])
                self.assertEqual(probe['request']['semantics'], result['semantics'])

    def test_references_are_user_supplied_not_fabricated_generations(self):
        golden = read_json(PACK / 'golden-set.json')
        self.assertEqual(2, golden['golden_set_version'])
        self.assertEqual({'cover', 'concept', 'diagram'}, {a['role'] for a in golden['assets']})
        for asset in golden['assets']:
            self.assertEqual('user-supplied', asset['provenance']['source_kind'])
            self.assertFalse(asset['provenance']['semantic_authority'])
            self.assertFalse(asset['provenance']['original_prompt_known'])
        self.assertEqual('passed', golden['qualification']['cross_topic_probe_status'])
        self.assertEqual('passed', golden['qualification']['neighbor_discrimination_status'])
        errors = validate_style_contract(ROOT, 'release', 'dense-technical-infographic')
        self.assertEqual([], errors)


if __name__ == '__main__':
    unittest.main()
