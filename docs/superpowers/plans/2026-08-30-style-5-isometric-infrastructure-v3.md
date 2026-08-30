# Style 5 Isometric Infrastructure v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Qualify `isometric-infrastructure` as a stable v3 style pack with three approved editorial-diorama goldens, cross-topic probes, and release validation.

**Architecture:** Add observable visual DNA, role-specific invariants, and same-role reference contracts around the existing Style 5 protocol. Approve image-generated cover and concept assets sequentially, render the exact human-free diagram deterministically from a frozen graph, then qualify the pack through prompt compilation, Style 3/4 discrimination, hashes, and release checks.

**Tech Stack:** JSON contracts, Markdown prompt records, Python `unittest`, `compile_image_prompt.py`, `validate_style_contract.py`, GPT Image generation, deterministic SVG, Node `sharp`, Git.

## Global Constraints

- Use a fully opaque pale gray matte ground based on `#EEF2F4`.
- Use one fixed 30-degree isometric camera and consistent module scale throughout each image.
- Use restrained blue modules based on `#4B8FD8`, dark edges based on `#243746`, and inactive modules based on `#AABAC5`.
- Use exactly one amber active path based on `#E8A43A`.
- Use one soft directional light and one shared shadow direction.
- Favor three to five substantial modules and generous ground-plane space over dense miniature infrastructure.
- Covers and concepts remain text-free; technical labels are deterministic overlays after semantic confirmation.
- Diagrams are human-free and render only the validated frozen graph.
- No random perspective, mixed cameras, vendor logos, server-rack clutter, glossy toys, glass, neon glow, multiple routes, decorative pipes, unsupported modules, or invented topology.
- Every reference contract forbids copying `labels`, `numbers`, `nodes`, `topology`, and `example_story`.

---

## File Map

- `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/visual-dna.json`: camera, scale, material, light, density, and Style 3/4 boundaries.
- `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/role-contracts.json`: cover, concept, and strict diagram rules.
- `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/reference-matrix.json`: same-role preserve/vary/do-not-copy rules.
- `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`: hashes, approvals, qualification, and assets.
- `evals/golden-production/05-isometric-infrastructure.json`: candidate requests, failures, and user approvals.
- `evals/style-pack-probes/05-isometric-infrastructure.json`: unrelated role probes and neighbor discrimination.
- `skills/article-visual-director/references/style-registry.json`: Style 5 v3 registration.
- `skills/article-visual-director/scripts/tests/test_skill_contract.py`: identity assertions.
- `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`: probe compilation and discrimination.

---

### Task 1: Bootstrap the Style 5 v3 Contract

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/visual-dna.json`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/role-contracts.json`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/reference-matrix.json`
- Modify: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`
- Modify: `skills/article-visual-director/references/style-registry.json`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: v3 schemas and the approved Style 5 design.
- Produces: a candidate pack accepted by protocol validation and `compile_prompt_ir`.

- [ ] **Step 1: Add the failing identity test**

```python
def test_style_5_v3_candidate_preserves_editorial_isometric_identity(self) -> None:
    root = SKILL_ROOT / "assets" / "style-anchors" / "isometric-infrastructure"
    dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
    roles = json.loads((root / "role-contracts.json").read_text(encoding="utf-8"))["roles"]
    matrix = json.loads((root / "reference-matrix.json").read_text(encoding="utf-8"))

    joined = json.dumps(dna, ensure_ascii=False)
    for phrase in (
        "pale gray matte ground",
        "fixed 30-degree isometric",
        "substantial modules",
        "single amber",
        "shared shadow direction",
        "Style 4",
        "Style 3",
    ):
        self.assertIn(phrase, joined)
    self.assertEqual("family", roles["cover"]["stability"])
    self.assertEqual("strict", roles["diagram"]["stability"])
    self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
    for reference in matrix["references"]:
        self.assertIn("topology", reference["must_not_copy"])
```

- [ ] **Step 2: Run the test and verify `FileNotFoundError`**

Run the exact test with the bundled Python runtime. The missing `visual-dna.json` must produce the failure.

- [ ] **Step 3: Create all three v3 contracts**

All files use:

```json
{"profile_id": "isometric-infrastructure", "style_pack_version": 3}
```

`visual-dna.json` defines `surface`, `palette_roles`, `line_language`, `material_and_texture`, `geometry`, `depth_and_camera`, `typography`, `density_and_spacing`, `required_traits`, `forbidden_traits`, and `neighbor_boundaries`. It includes every phrase asserted above and explicitly rejects Style 4's orthographic drafting grammar and Style 3's dark neon/glass grammar.

`role-contracts.json` defines exactly `cover`, `concept`, and `diagram`, with family stability for cover/concept and strict stability for diagram. The diagram contract requires exact frozen-graph fidelity and no people.

`reference-matrix.json` maps exactly one reference per role:

```json
[
  "isometric-infrastructure-cover-v1",
  "isometric-infrastructure-concept-v1",
  "isometric-infrastructure-diagram-v1"
]
```

Each reference includes all five required do-not-copy fields.

- [ ] **Step 4: Register and hash the candidate pack**

Add v3 paths, `style_pack_status: candidate`, and `adapter_ids: ["gpt-image"]` to Style 5. Expand `golden-set.json` with contract hashes, pending qualification, candidate status, pending user approval, and an empty asset list.

- [ ] **Step 5: Run protocol and complete identity tests**

Expected: protocol reports `"overall": "passed"`; all identity tests report `OK`.

- [ ] **Step 6: Commit**

```powershell
git commit -m "feat(article-visual-director): bootstrap style 5 v3 candidate"
```

---

### Task 2: Produce and Approve the Cover Golden

**Files:**
- Create: `evals/golden-production/05-isometric-infrastructure.json`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-cover.png`
- Modify: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`

**Interfaces:**
- Consumes: candidate Style 5 contract and GPT Image adapter.
- Produces: approved `isometric-infrastructure-cover-v1` with no semantic authority.

- [ ] **Step 1: Define the cover world**

Use one polished editorial diorama with exactly four substantial modules: a low source dock, one dominant coordination pavilion, one subordinate relay platform, and one destination archive. Connect them with one continuous amber ground path. Use a pale matte plane, fixed 30-degree camera, shared soft shadow, consistent scale, and a title-safe area. Block labels, logos, screens, rack detail, tiny buildings, multiple paths, pipes, glass, glow, and toy plastic.

- [ ] **Step 2: Compile the eight-block prompt**

Save the exact linted output to `golden-cover.prompt.md`; verify all five do-not-copy categories and no permanent golden reference in cover bootstrap.

- [ ] **Step 3: Generate one opaque candidate and inspect internally**

Reject any candidate that resembles a toy city, server farm, vendor marketing render, or sparse empty platform. Verify camera, scale, shared light, single path, occupancy, dimensions, and alpha before the user gate.

- [ ] **Step 4: Obtain explicit user approval**

Record rejection causes by revision. Never weaken camera, scale, material, semantic, or topology constraints to make an image pass.

- [ ] **Step 5: Register hashes and commit**

```powershell
git commit -m "feat(article-visual-director): approve style 5 cover golden"
```

---

### Task 3: Produce and Approve the Concept Golden

**Files:**
- Modify: `evals/golden-production/05-isometric-infrastructure.json`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-concept.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-concept.png`
- Modify: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`

**Interfaces:**
- Consumes: the approved cover as a same-profile style-only bootstrap.
- Produces: approved `isometric-infrastructure-concept-v1` on a different subject and topology.

- [ ] **Step 1: Define a distinct handoff relation**

Use three substantial modules on two ownership platforms: one source module on a lower blue platform, one amber handoff bridge, and one receiving module on a pale raised platform. The bridge is the only active transition. Do not reuse the cover's four modules, journey, pavilion, archive, or placement.

- [ ] **Step 2: Compile, generate, and inspect**

Attach the cover only as a non-semantic style reference. Require the same camera, scale family, matte material, light direction, density, and path visibility while blocking copied content.

- [ ] **Step 3: Obtain user approval, register hashes, and commit**

```powershell
git commit -m "feat(article-visual-director): approve style 5 concept golden"
```

---

### Task 4: Produce and Approve the Deterministic Diagram Golden

**Files:**
- Modify: `evals/golden-production/05-isometric-infrastructure.json`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-diagram.png`
- Modify: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`

**Interfaces:**
- Consumes: the validated frozen graph below.
- Produces: exact SVG IDs and an opaque PNG with no undeclared topology.

- [ ] **Step 1: Freeze the graph**

```json
{
  "nodes": ["source", "intake", "processing", "verification", "delivery", "rework"],
  "edges": [
    {"id": "edge-source-intake", "from": "source", "to": "intake", "type": "primary"},
    {"id": "edge-intake-processing", "from": "intake", "to": "processing", "type": "primary"},
    {"id": "edge-processing-verification", "from": "processing", "to": "verification", "type": "primary"},
    {"id": "edge-verification-delivery", "from": "verification", "to": "delivery", "type": "primary"},
    {"id": "edge-verification-rework", "from": "verification", "to": "rework", "type": "exception"},
    {"id": "edge-rework-processing", "from": "rework", "to": "processing", "type": "return"}
  ],
  "groups": [
    {"id": "execution", "members": ["source", "intake", "processing"]},
    {"id": "quality-and-result", "members": ["verification", "delivery", "rework"]}
  ],
  "invariants": [
    "Delivery is reachable only through verification.",
    "Rework returns only to processing and never directly to delivery."
  ]
}
```

- [ ] **Step 2: Render deterministic isometric SVG**

Use a 1536×864 opaque pale ground, exact 30-degree projected modules, shared platform thickness, one amber primary path, one restrained exception/return treatment, stable IDs, consistent shadows, and deterministic plaques. Add `Style reference only — example topology is non-authoritative`.

- [ ] **Step 3: Verify topology, XML, dimensions, RGB mode, and user approval**

Every node and edge ID appears exactly once. Reject overlaps, clipped plaques, mixed projection, extra edges, human elements, multiple amber paths, or transparency.

- [ ] **Step 4: Register hashes and commit**

```powershell
git commit -m "feat(article-visual-director): approve style 5 diagram golden"
```

---

### Task 5: Qualify and Release Style 5

**Files:**
- Create: `evals/style-pack-probes/05-isometric-infrastructure.json`
- Modify: `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`
- Modify: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`
- Modify: `skills/article-visual-director/references/style-registry.json`
- Modify: `evals/golden-production/05-isometric-infrastructure.json`

**Interfaces:**
- Consumes: all approved Style 5 assets and contracts.
- Produces: release-qualified Style 5 with no candidate marker.

- [ ] **Step 1: Add a failing probe-suite test**

Assert exactly one cover, concept, and diagram probe; compile and lint all prompts; verify the eight blocks and five do-not-copy fields; then assert:

```python
self.assertEqual("blueprint-linework", discrimination["compare_profile_id"])
self.assertIn("isometric", " ".join(discrimination["style_5_expected"]))
self.assertIn("orthographic", " ".join(discrimination["style_4_expected"]))
```

- [ ] **Step 2: Create three unrelated probes**

Use topics absent from the goldens. Each probe uses one same-role golden, one supported path, `semantic_authority: false`, and explicit rejection of copied content. Include Style 4 and Style 3 rejection checks in acceptance language.

- [ ] **Step 3: Mark approval and qualification complete**

Set all qualification fields to `passed`, set golden and user approval to `approved`, mark golden production approved, and remove `style_pack_status: candidate`.

- [ ] **Step 4: Run complete verification**

Run release validation, prompt compiler tests, validator tests, skill contract tests, and `git diff --check`. Expected: all pass with no errors.

- [ ] **Step 5: Commit qualification**

```powershell
git commit -m "feat(article-visual-director): qualify style 5 v3"
```

Never stage either `skills/article-visual-director/scripts/__pycache__/` directory.
