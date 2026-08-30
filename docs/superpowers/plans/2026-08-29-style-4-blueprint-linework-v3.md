# Style 4 Blueprint Linework v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Qualify `blueprint-linework` as a stable v3 style pack with three user-approved golden assets, prompt contracts, cross-topic probes, and release validation.

**Architecture:** Add the same v3 contract boundary used by qualified styles: observable visual DNA, role-specific contracts, and a reference matrix that forbids semantic copying. Bootstrap and approve the cover and concept with image generation, render the human-free diagram deterministically from a frozen graph, then qualify the pack through compiler, neighbor-discrimination, hash, and release checks.

**Tech Stack:** JSON contracts, Markdown prompt records, Python `unittest`, `compile_image_prompt.py`, `validate_style_contract.py`, GPT Image generation, deterministic SVG, Node `sharp`, Git.

## Global Constraints

- Golden references use the deep blueprint-blue ground based on `#123B66`; warm drafting paper remains a non-golden allowed inversion.
- Final and construction lines are uniform approximately 2 px, pale, orthographic, and unglowed.
- Cyan based on `#72D5FF` marks exactly one supported semantic boundary, layer, or transition.
- Outputs are fully opaque with a low-intensity drafting grid.
- Covers and concepts contain no generated technical text; deterministic overlays are added only after semantics are confirmed.
- Diagrams are fully human-free and render only the validated frozen graph.
- No isometric camera, perspective distortion, dramatic light, shadows, gloss, photorealism, fake dimensions, pseudo-engineering labels, dense crosshatching, decorative machinery, or unsupported topology.
- Every reference contract forbids copying `labels`, `numbers`, `nodes`, `topology`, and `example_story`.

---

## File Map

- `skills/article-visual-director/assets/style-anchors/blueprint-linework/visual-dna.json`: observable cross-role Style 4 identity and Style 5/7 boundaries.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/role-contracts.json`: cover, concept, and strict diagram invariants.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/reference-matrix.json`: same-role golden-reference preserve/vary/do-not-copy rules.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`: hashes, approvals, qualification, and golden asset registry.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.png`: approved opaque cover anchor.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.prompt.md`: exact approved cover generation prompt.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.png`: approved opaque concept anchor.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.prompt.md`: exact approved concept generation prompt.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.svg`: editable exact graph with stable node and edge IDs.
- `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.png`: opaque deterministic diagram anchor.
- `evals/golden-production/04-blueprint-linework.json`: candidate requests, acceptance checks, revision history, and user approvals.
- `evals/style-pack-probes/04-blueprint-linework.json`: unrelated cover, concept, and diagram regression probes plus Style 5 discrimination.
- `skills/article-visual-director/references/style-registry.json`: v3 pack paths and adapter registration.
- `skills/article-visual-director/scripts/tests/test_skill_contract.py`: Style 4 identity assertions.
- `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`: Style 4 probe compilation and neighbor discrimination.

---

### Task 1: Bootstrap the Style 4 v3 Contract

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/visual-dna.json`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/role-contracts.json`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/reference-matrix.json`
- Modify: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`
- Modify: `skills/article-visual-director/references/style-registry.json`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: v3 schema in `references/style-pack-schema.md` and the approved Style 4 design spec.
- Produces: a candidate pack discoverable by `compile_prompt_ir(skill_root, request)` and valid under protocol-phase validation.

- [ ] **Step 1: Add the failing Style 4 identity test**

Add this test to `test_skill_contract.py`:

```python
def test_style_4_v3_candidate_preserves_orthographic_blueprint_identity(self) -> None:
    root = SKILL_ROOT / "assets" / "style-anchors" / "blueprint-linework"
    dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
    roles = json.loads((root / "role-contracts.json").read_text(encoding="utf-8"))["roles"]
    matrix = json.loads((root / "reference-matrix.json").read_text(encoding="utf-8"))

    joined = json.dumps(dna, ensure_ascii=False)
    for phrase in (
        "deep blueprint-blue",
        "orthographic",
        "uniform two-pixel",
        "single cyan",
        "no fake dimensions",
        "Style 5",
    ):
        self.assertIn(phrase, joined)
    self.assertEqual("family", roles["cover"]["stability"])
    self.assertEqual("strict", roles["diagram"]["stability"])
    self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
    for reference in matrix["references"]:
        self.assertIn("topology", reference["must_not_copy"])
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\tests\test_skill_contract.py' SkillContractTests.test_style_4_v3_candidate_preserves_orthographic_blueprint_identity
```

Expected: `ERROR` because the three v3 contract files do not exist.

- [ ] **Step 3: Create the minimal complete contracts**

Create JSON objects with these exact top-level identities and responsibilities:

```json
{
  "profile_id": "blueprint-linework",
  "style_pack_version": 3
}
```

`visual-dna.json` must define `surface`, `palette_roles`, `line_language`, `material_and_texture`, `geometry`, `depth_and_camera`, `typography`, `density_and_spacing`, `required_traits`, `forbidden_traits`, and `neighbor_boundaries`. Its observable phrases must include the six strings asserted above. The Style 5 boundary must explicitly reject 30-degree isometric projection, matte spatial solids, and directional shadows. The Style 7 boundary must reject watercolor wash and variable hand-drawn contour behavior.

`role-contracts.json` must define exactly `cover`, `concept`, and `diagram`, each with `stability`, `must_preserve`, `may_vary`, `must_not_include`, and `acceptance_checks`. The diagram role must be `strict`, human-free, and require exact frozen-graph fidelity.

`reference-matrix.json` must define one same-role entry for each of:

```json
[
  "blueprint-linework-cover-v1",
  "blueprint-linework-concept-v1",
  "blueprint-linework-diagram-v1"
]
```

Each entry must contain `must_not_copy: ["labels", "numbers", "nodes", "topology", "example_story"]`.

- [ ] **Step 4: Register the candidate pack and pin contract hashes**

Add these fields to the Style 4 registry entry:

```json
"style_pack_version": 3,
"style_pack_status": "candidate",
"visual_dna_path": "assets/style-anchors/blueprint-linework/visual-dna.json",
"role_contracts_path": "assets/style-anchors/blueprint-linework/role-contracts.json",
"reference_matrix_path": "assets/style-anchors/blueprint-linework/reference-matrix.json",
"adapter_ids": ["gpt-image"]
```

Expand `golden-set.json` with the three SHA-256 hashes, all qualification fields `pending`, status `candidate`, pending user approval, and no approved assets.

- [ ] **Step 5: Run protocol and identity tests**

Run:

```powershell
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\validate_style_contract.py' --phase protocol --profile blueprint-linework
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\tests\test_skill_contract.py'
```

Expected: protocol reports `"overall": "passed"`; all identity tests report `OK`.

- [ ] **Step 6: Commit the candidate contract**

```powershell
git add -- skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json skills/article-visual-director/assets/style-anchors/blueprint-linework/visual-dna.json skills/article-visual-director/assets/style-anchors/blueprint-linework/role-contracts.json skills/article-visual-director/assets/style-anchors/blueprint-linework/reference-matrix.json skills/article-visual-director/references/style-registry.json skills/article-visual-director/scripts/tests/test_skill_contract.py
git commit -m "feat(article-visual-director): bootstrap style 4 v3 candidate"
```

---

### Task 2: Produce and Approve the Cover Golden

**Files:**
- Create: `evals/golden-production/04-blueprint-linework.json`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.png`
- Modify: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`

**Interfaces:**
- Consumes: candidate Style 4 v3 contract and GPT Image adapter.
- Produces: approved `blueprint-linework-cover-v1`, usable only as a same-profile style reference with `semantic_authority: false`.

- [ ] **Step 1: Define the cover candidate request**

Create `evals/golden-production/04-blueprint-linework.json` with status `planned`. The cover request must specify one large text-free orthographic cutaway showing an outer shell, one explicitly supported boundary, and an inner protected structure. It must occupy 76–84 percent of a 16:9 canvas, preserve a title-safe band, use deep blue, pale 2 px lines, and exactly one cyan boundary. Block all dimensions, labels, isometric projection, shadows, gloss, and decorative machinery.

- [ ] **Step 2: Compile and save the exact prompt**

Run `compile_image_prompt.py` for the request and save the rendered eight-block GPT Image prompt to `golden-cover.prompt.md`. Verify each required block appears exactly once and the reference contract includes all five do-not-copy categories.

- [ ] **Step 3: Generate one opaque cover candidate**

Generate a 16:9 raster using the compiled prompt without a semantic reference image. Reject candidates with transparency, small subject occupancy, perspective, fake labels, decorative measurements, or more than one cyan emphasis.

- [ ] **Step 4: Show the candidate and wait for explicit user approval**

Do not register the asset before approval. If rejected, record the feedback in the candidate revision, update only the failed acceptance constraints, and generate a new revision without weakening the visual contract.

- [ ] **Step 5: Pin the approved image and prompt hashes**

Add `blueprint-linework-cover-v1` to `golden-set.json` with renderer `imagegen`, artifact and prompt paths, SHA-256 hashes, and a `reference_role` limited to orthographic macro construction, deep-blue surface, line discipline, occupancy, and title-safe behavior.

- [ ] **Step 6: Commit the approved cover**

```powershell
git add -- evals/golden-production/04-blueprint-linework.json skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.png skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.prompt.md skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json
git commit -m "feat(article-visual-director): approve style 4 cover golden"
```

---

### Task 3: Produce and Approve the Concept Golden

**Files:**
- Modify: `evals/golden-production/04-blueprint-linework.json`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.png`
- Modify: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`

**Interfaces:**
- Consumes: approved cover for style-only bootstrap.
- Produces: approved `blueprint-linework-concept-v1` with a different subject and relationship.

- [ ] **Step 1: Define a non-cover concept request**

Use one main orthographic outline and at most one ghosted layer to explain a single interface, layer, or component relation. The subject must not reuse the cover shell, protected interior, outside-boundary-inside story, or object positions. The cover bootstrap reference must be approved, same-profile, and `semantic_authority: false`.

- [ ] **Step 2: Compile, lint, and save the concept prompt**

Save the exact compiled prompt to `golden-concept.prompt.md`. Confirm its reference contract preserves only surface, projection, line hierarchy, grid restraint, occupancy, and annotation-zone behavior.

- [ ] **Step 3: Generate, inspect, and gate the concept candidate**

Require a fully opaque 16:9 image, disciplined subject-to-canvas ratio, no text, no dimensions, no isometric depth, and one semantic cyan feature. Show the candidate to the user and wait for explicit approval.

- [ ] **Step 4: Register hashes and commit**

Add `blueprint-linework-concept-v1` to `golden-set.json`, record approval feedback and hashes, then commit:

```powershell
git add -- evals/golden-production/04-blueprint-linework.json skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.png skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.prompt.md skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json
git commit -m "feat(article-visual-director): approve style 4 concept golden"
```

---

### Task 4: Produce and Approve the Deterministic Diagram Golden

**Files:**
- Modify: `evals/golden-production/04-blueprint-linework.json`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.png`
- Modify: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`

**Interfaces:**
- Consumes: a frozen semantic graph stored in the golden-production request.
- Produces: stable SVG node/edge IDs and an opaque PNG that contains no undeclared topology.

- [ ] **Step 1: Freeze a graph unrelated to cover and concept**

Define exactly these six nodes and six directed edges:

```json
{
  "nodes": ["draft-spec", "component-build", "interface-check", "integration", "release", "correction"],
  "edges": [
    {"id": "edge-spec-build", "from": "draft-spec", "to": "component-build", "type": "primary"},
    {"id": "edge-build-check", "from": "component-build", "to": "interface-check", "type": "primary"},
    {"id": "edge-check-integration", "from": "interface-check", "to": "integration", "type": "primary"},
    {"id": "edge-integration-release", "from": "integration", "to": "release", "type": "primary"},
    {"id": "edge-check-correction", "from": "interface-check", "to": "correction", "type": "exception"},
    {"id": "edge-correction-build", "from": "correction", "to": "component-build", "type": "return"}
  ],
  "groups": [
    {"id": "preparation", "members": ["draft-spec", "component-build"]},
    {"id": "validation-and-release", "members": ["interface-check", "integration", "release", "correction"]}
  ],
  "invariants": [
    "Release is reachable only through interface-check and integration.",
    "Correction returns only to component-build and never directly to release."
  ]
}
```

The graph is human-free and does not repeat the cover or concept relationship.

- [ ] **Step 2: Write the SVG from the frozen graph**

Use a 1536×864 deep-blue background, a low-intensity 20 px grid, uniform 2 px pale lines, orthogonal arrows, restrained drafting captions, and exactly one supported cyan thesis feature. Give every graph element an ID matching the frozen graph. Add the deterministic note: `Style reference only — example topology is non-authoritative`.

- [ ] **Step 3: Verify source topology and render PNG**

Use `rg` to assert every node and edge ID appears exactly once. Parse the SVG as XML. Render with bundled Node `sharp`, flatten to `#123B66`, and verify PNG size `(1536, 864)`, mode `RGB`, and no alpha channel.

- [ ] **Step 4: Inspect and obtain user approval**

Reject any overlap, clipped caption, diagonal perspective cue, human element, fake measurement, extra edge, or transparency. Show the corrected PNG and wait for explicit approval.

- [ ] **Step 5: Register hashes and commit**

Add `blueprint-linework-diagram-v1` with renderer `deterministic-diagram`, PNG hash, editable SVG path and hash, and a style-only reference role. Commit:

```powershell
git add -- evals/golden-production/04-blueprint-linework.json skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.svg skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.png skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json
git commit -m "feat(article-visual-director): approve style 4 diagram golden"
```

---

### Task 5: Qualify and Release Style 4

**Files:**
- Create: `evals/style-pack-probes/04-blueprint-linework.json`
- Modify: `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`
- Modify: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`
- Modify: `skills/article-visual-director/references/style-registry.json`
- Modify: `evals/golden-production/04-blueprint-linework.json`

**Interfaces:**
- Consumes: all three approved Style 4 goldens and their pinned contracts.
- Produces: a release-qualified pack with all qualification fields `passed` and no candidate registry marker.

- [ ] **Step 1: Add a failing Style 4 probe-suite test**

Add a test that loads `04-blueprint-linework.json`, asserts exactly one cover, concept, and diagram probe, compiles and lints each request, checks the eight prompt blocks, verifies all five do-not-copy categories, and asserts:

```python
self.assertEqual("isometric-infrastructure", discrimination["compare_profile_id"])
self.assertIn("orthographic", " ".join(discrimination["style_4_expected"]))
self.assertIn("isometric", " ".join(discrimination["style_5_expected"]))
```

- [ ] **Step 2: Verify the probe test fails**

Expected: `FileNotFoundError` for `evals/style-pack-probes/04-blueprint-linework.json`.

- [ ] **Step 3: Create three unrelated probes**

Create one cover, one concept, and one frozen-graph diagram probe on subjects not used by any golden. Every probe must reference only its same-role golden, keep `semantic_authority: false`, and forbid copied labels, numbers, nodes, topology, and example story. The neighbor section must contrast flat orthographic pale linework and single cyan emphasis with Style 5's 30-degree isometric camera, matte spatial solids, and directional shadows.

- [ ] **Step 4: Run prompt and discrimination tests**

Run the targeted Style 4 test, then the full `test_compile_image_prompt.py`. Expected: all tests `OK`.

- [ ] **Step 5: Mark qualification and approval complete**

Set all three `golden-set.json` qualification fields to `passed`, set golden and user approval status to `approved`, mark golden production `approved`, and remove `style_pack_status: candidate` from the Style 4 registry entry.

- [ ] **Step 6: Run full release verification**

Run:

```powershell
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\validate_style_contract.py' --phase release --profile blueprint-linework
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\tests\test_compile_image_prompt.py'
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\tests\test_validate_style_contract.py'
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'skills\article-visual-director\scripts\tests\test_skill_contract.py'
git diff --check
```

Expected: release returns `"overall": "passed"`, every suite reports `OK`, and `git diff --check` emits no errors.

- [ ] **Step 7: Commit qualification**

```powershell
git add -- evals/golden-production/04-blueprint-linework.json evals/style-pack-probes/04-blueprint-linework.json skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json skills/article-visual-director/references/style-registry.json skills/article-visual-director/scripts/tests/test_compile_image_prompt.py
git commit -m "feat(article-visual-director): qualify style 4 v3"
```

Do not stage either `skills/article-visual-director/scripts/__pycache__/` directory.
