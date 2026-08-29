# Article Visual Director Style Pack v3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the model-neutral Style Pack v3 contracts, GPT Image prompt compiler, fail-closed validation, and a candidate v3 migration of the already approved Style 8 assets.

**Architecture:** Keep the current eight-mode registry, human-readable protocols, deterministic tokens, Manifest v2, approval gates, and Markdown integration. Add machine-readable Visual DNA, role contracts, reference inheritance matrices, a model-neutral Prompt IR, and a GPT Image adapter; activate Style 8 only after its qualification probes pass.

**Tech Stack:** Python 3 standard library, JSON, Markdown, `unittest`, existing `article-visual-director` scripts.

## Global Constraints

- Preserve all eight mode names, ordinals, `profile_id` values, and the mandatory style-selection gate.
- Keep `publication_theme`, `visual_profile`, and `asset_semantics` separate.
- Golden image content is non-authoritative; labels, numbers, nodes, topology, and example stories must never become article facts.
- Use strict layout stability for diagrams and visual-family stability with composition freedom for covers and concepts.
- Keep the core protocol model-neutral and compile GPT Image prompts through an adapter.
- Preserve Manifest v1 and legacy Manifest v2 behavior; new v3 tasks add fields without silently upgrading old manifests.
- Do not change `apply_visual_plan.py` integration semantics, path safety, BOM, line-ending, idempotency, or source-protection behavior.
- Do not add third-party gallery images or copied third-party prompts to the repository.
- Do not activate a profile as Style Pack v3 until schema, prompt compilation, cross-topic probes, neighbor discrimination, and explicit user approval pass.
- Use RED–GREEN–REFACTOR and commit after each independently testable task.

---

## File Map

| File | Responsibility |
|---|---|
| `references/style-pack-schema.md` | Human-readable normative Style Pack v3 contract |
| `references/prompt-ir-schema.md` | Model-neutral Prompt IR and eight-block output contract |
| `references/adapters/gpt-image.md` | GPT Image-specific rendering of Prompt IR |
| `scripts/compile_image_prompt.py` | Load registered v3 pack, build/lint Prompt IR, render adapter output |
| `scripts/validate_style_contract.py` | Validate optional v3 registry entries, pack JSON, hashes, and release qualification |
| `scripts/validate_manifest.py` | Validate additive v3 fields only when `style.style_pack_version == 3` |
| `assets/style-anchors/handwritten-systems-explainer/visual-dna.json` | Style 8 cross-role invariants |
| `assets/style-anchors/handwritten-systems-explainer/role-contracts.json` | Style 8 cover/concept/diagram stability rules |
| `assets/style-anchors/handwritten-systems-explainer/reference-matrix.json` | Style 8 per-golden inheritance and non-copy rules |
| `evals/style-pack-probes/08-handwritten-systems-explainer.json` | Three cross-topic probe inputs and observable acceptance checks |
| existing test modules | TDD coverage for contracts, compiler, validator, manifest, and Skill workflow |

### Task 1: Add normative schema and adapter references

**Files:**
- Create: `skills/article-visual-director/references/style-pack-schema.md`
- Create: `skills/article-visual-director/references/prompt-ir-schema.md`
- Create: `skills/article-visual-director/references/adapters/gpt-image.md`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Produces: exact required JSON keys and prompt block names consumed by Tasks 2–5.
- Consumes: the approved design spec and existing `style-protocol-schema.md`.

- [ ] **Step 1: Write the failing contract test**

Add a test that requires all three files and the exact prompt block names:

```python
def test_style_pack_v3_reference_contracts_exist(self) -> None:
    required = {
        "references/style-pack-schema.md": [
            "visual-dna.json", "role-contracts.json", "reference-matrix.json"
        ],
        "references/prompt-ir-schema.md": [
            "OUTPUT CONTRACT", "ARTICLE SEMANTICS", "ROLE COMPOSITION",
            "VISUAL DNA", "REFERENCE CONTRACT", "TEXT POLICY",
            "NEGATIVE CONSTRAINTS", "ACCEPTANCE CHECK",
        ],
        "references/adapters/gpt-image.md": [
            "same-role golden", "must_preserve", "must_not_copy"
        ],
    }
    for relative, phrases in required.items():
        text = (SKILL_ROOT / relative).read_text(encoding="utf-8")
        for phrase in phrases:
            self.assertIn(phrase, text)
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
```

Expected: FAIL because the three reference files do not exist.

- [ ] **Step 3: Write the three contracts**

Define exact top-level keys:

```text
visual-dna.json:
profile_id, style_pack_version, surface, palette_roles, line_language,
material_and_texture, geometry, depth_and_camera, typography,
density_and_spacing, required_traits, forbidden_traits, neighbor_boundaries

role-contracts.json:
profile_id, style_pack_version, roles.cover, roles.concept, roles.diagram

reference-matrix.json:
profile_id, style_pack_version, references[].golden_asset_id,
references[].role, references[].must_preserve,
references[].may_vary, references[].must_not_copy
```

Specify that every inheritance item is a non-empty observable string, diagram semantics come only from a frozen graph, and adapters cannot add article facts.

- [ ] **Step 4: Run the test and verify GREEN**

Run the same unittest command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add skills/article-visual-director/references skills/article-visual-director/scripts/tests/test_skill_contract.py
git commit -m "docs(article-visual-director): define style pack v3 contracts"
```

### Task 2: Extend style-contract validation for optional v3 packs

**Files:**
- Modify: `skills/article-visual-director/scripts/validate_style_contract.py`
- Modify: `skills/article-visual-director/scripts/tests/test_validate_style_contract.py`

**Interfaces:**
- Produces: `validate_style_pack_v3(skill_root, profile_index, registry_item, golden) -> list[dict[str, str]]`.
- Consumes: registry keys `style_pack_version`, `visual_dna_path`, `role_contracts_path`, and `reference_matrix_path`.

- [ ] **Step 1: Add failing validator tests**

Add fixtures and tests for these exact outcomes:

```python
def test_v3_registry_requires_all_pack_paths(self) -> None:
    self.registry_profile["style_pack_version"] = 3
    errors = validate_style_contract(self.skill_root, "protocol")
    self.assertTrue(any(e["code"] == "style_pack_path_missing" for e in errors))

def test_v3_visual_dna_requires_observable_traits(self) -> None:
    self.enable_v3_fixture()
    self.visual_dna_path.write_text(json.dumps({
        "profile_id": "fixture-profile",
        "style_pack_version": 3,
        "required_traits": ["beautiful"]
    }), encoding="utf-8")
    errors = validate_style_contract(self.skill_root, "protocol")
    self.assertTrue(any(e["code"] == "visual_dna_invalid" for e in errors))

def test_v3_release_requires_qualification(self) -> None:
    self.enable_v3_fixture(approved=True, qualified=False)
    errors = validate_style_contract(self.skill_root, "release")
    self.assertTrue(any(e["code"] == "style_pack_not_qualified" for e in errors))
```

`enable_v3_fixture()` writes all required JSON objects and updates the temporary registry and golden-set hashes.

- [ ] **Step 2: Run the tests and verify RED**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_style_contract.py -v
```

Expected: FAIL because v3 registry fields are ignored.

- [ ] **Step 3: Implement fail-closed v3 validation**

Add these constants and helpers:

```python
STYLE_PACK_VERSION = 3
STYLE_PACK_PATH_FIELDS = (
    "visual_dna_path", "role_contracts_path", "reference_matrix_path"
)
REQUIRED_VISUAL_DNA_KEYS = {
    "profile_id", "style_pack_version", "surface", "palette_roles",
    "line_language", "material_and_texture", "geometry",
    "depth_and_camera", "typography", "density_and_spacing",
    "required_traits", "forbidden_traits", "neighbor_boundaries",
}
REQUIRED_ROLES = {"cover", "concept", "diagram"}
REQUIRED_NON_COPY = {"labels", "numbers", "nodes", "topology", "example_story"}

def _observable_list(value: object) -> bool:
    return (
        isinstance(value, list) and bool(value)
        and all(isinstance(item, str) and len(item.strip()) >= 8 for item in value)
    )
```

Validation must check identity/version, required keys, exact roles, one matrix entry per golden role, required non-copy tokens, safe paths, and hashes stored in an approved golden set. Release additionally requires all three qualification statuses to equal `passed`.

- [ ] **Step 4: Run tests and verify GREEN**

Run the Task 2 unittest command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add skills/article-visual-director/scripts/validate_style_contract.py skills/article-visual-director/scripts/tests/test_validate_style_contract.py
git commit -m "feat(article-visual-director): validate style pack v3"
```

### Task 3: Build the model-neutral Prompt IR and GPT Image compiler

**Files:**
- Create: `skills/article-visual-director/scripts/compile_image_prompt.py`
- Create: `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`

**Interfaces:**
- Produces: `compile_prompt_ir(skill_root: Path, request: dict[str, Any]) -> dict[str, Any]`.
- Produces: `lint_prompt_ir(prompt_ir: dict[str, Any]) -> list[dict[str, str]]`.
- Produces: `render_gpt_image_prompt(prompt_ir: dict[str, Any]) -> str`.
- Request requires: `profile_id`, `asset_role`, `objective`, `semantics`, `composition`, `text_policy`, `platform`, `golden_reference_ids`, and optional `article_anchor_reference_ids`.

- [ ] **Step 1: Write failing compiler tests**

```python
def test_compiler_renders_all_eight_blocks(self) -> None:
    prompt_ir = compile_prompt_ir(self.skill_root, self.valid_request("concept"))
    rendered = render_gpt_image_prompt(prompt_ir)
    for heading in REQUIRED_PROMPT_BLOCKS:
        self.assertIn(f"[{heading}]", rendered)

def test_diagram_requires_frozen_semantic_graph(self) -> None:
    request = self.valid_request("diagram")
    request["semantics"].pop("frozen_graph")
    with self.assertRaisesRegex(PromptCompileError, "SEMANTIC_TOPOLOGY_DRIFT"):
        compile_prompt_ir(self.skill_root, request)

def test_reference_contract_blocks_golden_content_copy(self) -> None:
    ir = compile_prompt_ir(self.skill_root, self.valid_request("cover"))
    blocked = set(ir["reference_contract"]["must_not_copy"])
    self.assertTrue({"labels", "numbers", "nodes", "topology", "example_story"} <= blocked)
```

- [ ] **Step 2: Run compiler tests and verify RED**

```powershell
python skills/article-visual-director/scripts/tests/test_compile_image_prompt.py -v
```

Expected: import failure because `compile_image_prompt.py` does not exist.

- [ ] **Step 3: Implement the compiler**

Use this public surface:

```python
REQUIRED_PROMPT_BLOCKS = (
    "OUTPUT CONTRACT", "ARTICLE SEMANTICS", "ROLE COMPOSITION",
    "VISUAL DNA", "REFERENCE CONTRACT", "TEXT POLICY",
    "NEGATIVE CONSTRAINTS", "ACCEPTANCE CHECK",
)

class PromptCompileError(ValueError):
    pass

def compile_prompt_ir(skill_root: Path, request: dict[str, Any]) -> dict[str, Any]:
    """Load one registered v3 profile and merge semantics without adding facts."""

def lint_prompt_ir(prompt_ir: dict[str, Any]) -> list[dict[str, str]]:
    """Return structured hard errors; an empty list is generation-ready."""

def render_gpt_image_prompt(prompt_ir: dict[str, Any]) -> str:
    """Render the eight stable blocks in order with JSON for nested facts."""
```

The CLI accepts `--request`, `--out-ir`, and `--out-prompt`; it writes UTF-8 without BOM and exits 1 with JSON errors when lint fails.

- [ ] **Step 4: Run compiler tests and verify GREEN**

Run the Task 3 unittest command. Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add skills/article-visual-director/scripts/compile_image_prompt.py skills/article-visual-director/scripts/tests/test_compile_image_prompt.py
git commit -m "feat(article-visual-director): compile structured image prompts"
```

### Task 4: Create and register the Style 8 candidate v3 pack

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/visual-dna.json`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/role-contracts.json`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/reference-matrix.json`
- Modify: `skills/article-visual-director/references/style-registry.json`
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-set.json`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Produces: the first real Style Pack v3 profile, still release-blocked while qualification probes are pending.
- Consumes: existing Style 8 protocol, tokens, prompts, approved images, hashes, and approval notes.

- [ ] **Step 1: Add a failing Style 8 preservation test**

Require observable Style 8 traits and role separation:

```python
def test_style_8_v3_preserves_approved_identity(self) -> None:
    root = SKILL_ROOT / "assets/style-anchors/handwritten-systems-explainer"
    dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
    roles = json.loads((root / "role-contracts.json").read_text(encoding="utf-8"))
    matrix = json.loads((root / "reference-matrix.json").read_text(encoding="utf-8"))
    joined = json.dumps(dna, ensure_ascii=False)
    for phrase in ("warm ivory", "fine lively", "pastel", "handwritten"):
        self.assertIn(phrase, joined)
    self.assertEqual("strict", roles["roles"]["diagram"]["stability"])
    self.assertEqual("family", roles["roles"]["cover"]["stability"])
    for reference in matrix["references"]:
        self.assertIn("topology", reference["must_not_copy"])
```

- [ ] **Step 2: Run the test and verify RED**

Run the Task 1 Skill contract suite. Expected: FAIL because the v3 JSON files do not exist.

- [ ] **Step 3: Create the three JSON contracts**

Extract only properties already supported by the approved Style 8 protocol, prompts, tokens, and images. Use `family` stability for cover/concept and `strict` for diagram. Make diagram explicitly human-free; make every reference prohibit copying labels, numbers, nodes, topology, and example story.

- [ ] **Step 4: Register Style 8 as v3 candidate and freeze hashes**

Add the three v3 paths and `adapter_ids: ["gpt-image"]` to the Style 8 registry entry. Extend its golden set with computed v3 hashes and:

```json
"qualification": {
  "prompt_compile_status": "passed",
  "cross_topic_probe_status": "pending",
  "neighbor_discrimination_status": "pending"
}
```

Keep the existing three images, their hashes, prompt files, `status=approved`, and `user_approval.status=approved` unchanged. Release validation must remain blocked until the two pending statuses pass.

- [ ] **Step 5: Run protocol and compiler validation**

```powershell
python skills/article-visual-director/scripts/validate_style_contract.py --phase protocol --profile handwritten-systems-explainer
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
python skills/article-visual-director/scripts/tests/test_compile_image_prompt.py -v
```

Expected: protocol and tests PASS. Release validation is expected to FAIL only with `style_pack_not_qualified`.

- [ ] **Step 6: Commit**

```powershell
git add skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer skills/article-visual-director/references/style-registry.json skills/article-visual-director/scripts/tests/test_skill_contract.py
git commit -m "feat(article-visual-director): migrate style 8 to v3 candidate"
```

### Task 5: Wire v3 traceability into Manifest v2 and the Skill workflow

**Files:**
- Modify: `skills/article-visual-director/references/manifest-schema.md`
- Modify: `skills/article-visual-director/SKILL.md`
- Modify: `skills/article-visual-director/scripts/validate_manifest.py`
- Modify: `skills/article-visual-director/scripts/tests/test_validate_manifest.py`
- Modify: `evals/article-visual-director-cases.md`

**Interfaces:**
- Consumes: compiler output paths and hashes from Task 3.
- Produces: additive Manifest v2 validation when `style.style_pack_version == 3`; legacy manifests remain unchanged.

- [ ] **Step 1: Write failing Manifest v3-extension tests**

Add a fixture with `style_pack_version=3` and test:

```python
def test_v3_style_requires_pack_and_prompt_traceability(self) -> None:
    data = self.make_v2_manifest()
    data["style"]["style_pack_version"] = 3
    self.assert_error(data, "missing_style_pack_field")

def test_legacy_v2_without_style_pack_remains_valid(self) -> None:
    data = self.make_v2_manifest()
    self.assertEqual([], validate_manifest(
        data, self.manifest_path, "plan", skill_root=self.skill_root
    ))
```

- [ ] **Step 2: Run tests and verify RED**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_manifest.py -v
```

Expected: FAIL because v3 extension fields are ignored.

- [ ] **Step 3: Implement additive Manifest validation**

When and only when `style_pack_version == 3`, require safe paths and valid SHA-256 values for:

```text
visual_dna_path / visual_dna_sha256
role_contracts_path / role_contracts_sha256
reference_matrix_path / reference_matrix_sha256
adapter_id / adapter_version
prompt_ir_path / prompt_ir_sha256
compiled_prompt_path / compiled_prompt_sha256
```

Extend per-asset `style_validation` with `drift_codes`, restricted to the eight approved codes. Do not reinterpret manifests without `style_pack_version`.

- [ ] **Step 4: Update Skill and eval contract**

Insert `compile Prompt IR -> preflight lint` after plan approval and before article-anchor generation. State that v3 failures never fall back to free-form prompts. Add an eval where a mode is selected but the compiled prompt lacks `REFERENCE CONTRACT`; expected behavior is to stop with `PROMPT_BLOCK_MISSING`.

- [ ] **Step 5: Run tests and verify GREEN**

Run Manifest tests plus Skill contract tests. Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add skills/article-visual-director/SKILL.md skills/article-visual-director/references/manifest-schema.md skills/article-visual-director/scripts/validate_manifest.py skills/article-visual-director/scripts/tests/test_validate_manifest.py evals/article-visual-director-cases.md
git commit -m "feat(article-visual-director): require prompt traceability for v3"
```

### Task 6: Define Style 8 qualification probes and stop at the image approval gate

**Files:**
- Create: `evals/style-pack-probes/08-handwritten-systems-explainer.json`
- Create after compilation: a temporary Prompt IR and prompt for each probe outside the golden directory
- Modify only after user approval: Style 8 `golden-set.json` qualification fields

**Interfaces:**
- Produces: three approved test scenarios for cover, concept, and diagram plus Style 7/8 discrimination evidence.
- Consumes: Task 3 compiler and Task 4 Style 8 pack.

- [ ] **Step 1: Write the probe suite**

Use three semantics unrelated to the current golden stories:

1. cover: “context budget narrows as tool output grows”;
2. concept: “a retrieval query becomes evidence, then a bounded answer”;
3. diagram: a five-node read-only knowledge access flow with an explicitly blocked direct-write edge.

Each probe declares `must_preserve`, `must_not_copy`, role-specific acceptance checks, and no publication-theme override.

- [ ] **Step 2: Compile and lint all three prompts**

Run the compiler for each request. Expected: three Prompt IR files, three eight-block prompts, and no lint errors.

- [ ] **Step 3: Present the exact probe plan and prompts to the user**

Stop before image generation. The user must approve the probe plan under the existing visual-plan gate.

- [ ] **Step 4: After approval, generate and inspect probes one at a time**

Use the permanent same-role golden image and the new v3 reference matrix. Record semantic, style, and series results. Do not add probe images to the permanent golden set.

- [ ] **Step 5: Run Style 7/8 discrimination**

Compile the same concept through both protocols. Confirm Style 7 remains low-density, fine-contour, watercolor-led, and minimally annotated while Style 8 remains organized, high-density, handwritten, and systems-oriented.

- [ ] **Step 6: Activate Style 8 release qualification**

Only after explicit user approval, change both pending qualification fields to `passed`, refresh hashes, run release validation, and commit:

```powershell
git add evals/style-pack-probes skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-set.json
git commit -m "feat(article-visual-director): qualify style 8 v3"
```

### Task 7: Full verification and handoff

**Files:**
- Modify: `CHANGELOG.md`
- Verify: all files touched by Tasks 1–6

**Interfaces:**
- Produces: verified foundation ready for separate per-mode golden-production plans.

- [ ] **Step 1: Document the foundation and Style 8 migration**

Add an Unreleased changelog entry covering Style Pack v3, structured prompt compilation, fail-closed drift checks, Style 8 migration, and the fact that modes 1–7 remain candidate.

- [ ] **Step 2: Run focused tests**

```powershell
python -m unittest discover -s skills/article-visual-director/scripts/tests -v
python skills/article-visual-director/scripts/validate_style_contract.py --phase protocol
python skills/article-visual-director/scripts/validate_style_contract.py --phase release --profile handwritten-systems-explainer
```

Expected: all tests PASS; protocol validation PASS; release validation PASS only after Task 6 approval.

- [ ] **Step 3: Run repository tests and whitespace checks**

```powershell
Get-ChildItem scripts -Filter '*.test.js' | Sort-Object Name | ForEach-Object { node $_.FullName; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE } }
git diff --check
```

Expected: all tests PASS and no whitespace errors.

- [ ] **Step 4: Confirm the worktree boundary**

`git status --short` may show the two existing untracked `__pycache__` directories. They must not be staged or committed.

- [ ] **Step 5: Commit the changelog and any final test-only adjustments**

```powershell
git add CHANGELOG.md
git commit -m "docs(article-visual-director): record style pack v3 foundation"
```

- [ ] **Step 6: Report the checkpoint**

Report commits, test commands, Style 8 qualification status, remaining user approval gates, and that modes 1–7 require separate golden-production cycles.
