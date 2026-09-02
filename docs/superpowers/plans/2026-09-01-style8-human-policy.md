# Style 8 Human-Free Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Style 8 from repeating a fixed cartoon instructor while retaining a narrow, explicitly approved exception for article semantics that genuinely require a human actor.

**Architecture:** Make the human policy normative in the Style 8 protocol, encode the same policy in role contracts and the reference matrix, and make the permanent cover/concept anchors human-free. Contract tests guard both the default and the semantic exception; golden metadata changes only after visual approval.

**Tech Stack:** Markdown skill contracts, JSON Style Pack v3 contracts, Python `unittest`, SHA-256 asset manifests, GPT Image golden assets.

## Global Constraints

- Style 8 cover, concept, and diagram roles are human-free by default.
- A generic human symbol is allowed only when article semantics require a human actor and the approved brief names why a non-human primitive would lose meaning.
- Never introduce or copy a recurring instructor, narrator, mascot, character identity, face, pose, silhouette, or people count.
- Preserve Style 8 paper, line, palette, node, arrow, annotation-density, and frozen-topology behavior.
- Do not touch Style 9, image-density behavior, or the excluded fourth article.
- Do not replace official golden PNG files until the user explicitly approves the candidates.

---

### Task 1: Add the human-policy regression contract

**Files:**
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`
- Test: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: Style 8 protocol Markdown and Style Pack JSON/prompt files.
- Produces: `test_style_8_defaults_to_non_human_explanatory_subjects` and an updated Style 8 identity assertion.

- [ ] **Step 1: Write the failing test**

Add one test that loads the protocol, role contracts, reference matrix, and cover/concept prompts. Assert the human-free default, the two-part semantic exception, the recurring-character prohibition, all five reference-copy prohibitions, and non-human golden subjects. Replace the obsolete assertion for `miniature instructor figures` with assertions for `non-human explanatory primitives`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
python -m unittest skills.article-visual-director.scripts.tests.test_skill_contract.SkillContractTests.test_style_8_defaults_to_non_human_explanatory_subjects -v
```

Expected: FAIL because the current protocol and contracts still require or encourage an instructor/narrator.

- [ ] **Step 3: Commit no implementation yet**

Keep the failing test uncommitted until Task 2 makes it green so the branch never records a deliberately broken state.

### Task 2: Make the Style 8 contracts human-free by default

**Files:**
- Modify: `skills/article-visual-director/references/styles/08-handwritten-systems-explainer.md`
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/visual-dna.json`
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/role-contracts.json`
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/reference-matrix.json`

**Interfaces:**
- Consumes: The approved human-element policy in the design spec.
- Produces: A normative default, a machine-readable role policy, and reference-isolation constraints used by prompt compilation.

- [ ] **Step 1: Write the minimal protocol change**

Replace visible narrator/instructor requirements with this output recipe: use documents, code blocks, queues, clocks, formulas, arrows, boundaries, state cards, and technical icons as explanatory subjects. State the observable exception: a generic human symbol is allowed only when article semantics explicitly require a human actor and the approved brief explains why non-human primitives lose meaning.

- [ ] **Step 2: Align role contracts**

For cover and concept roles, put `no unapproved people`, `no recurring instructor narrator or mascot`, and `no inherited character identity` into `must_not_include`. Put the semantic exception in `may_vary`. Preserve the diagram's unconditional human-free rule.

- [ ] **Step 3: Isolate reference content**

Add `character_identity`, `face`, `pose`, `silhouette`, and `people_count` to the cover and concept `must_not_copy` lists. Remove any instruction to preserve reaction figures or vary instructor pose/narrator presence.

- [ ] **Step 4: Run focused test to verify green**

Run the focused unittest command from Task 1. Expected: PASS.

### Task 3: Rewrite human-free golden prompts

**Files:**
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-cover.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-concept.prompt.md`

**Interfaces:**
- Consumes: Human-free role contracts and the existing Style 8 visual grammar.
- Produces: Two prompts whose semantic subjects are technical objects rather than people.

- [ ] **Step 1: Rewrite the cover prompt**

Use a left-side annotation/key block and two capability-comparison lanes. Keep the identical orange AI multiplier, stronger/weaker blue starting structures, coherent green outputs, coral gap bracket, crop safety, and Style 8 material behavior. Explicitly require no people, faces, hands, instructor, narrator, mascot, or character.

- [ ] **Step 2: Rewrite the concept prompt**

Use a document/message relay through queue, translation, context, and validation nodes; show clocks, fragment loss, coral rework, and a compact direct AI loop. Explicitly require no people, faces, hands, instructor, narrator, mascot, or character.

- [ ] **Step 3: Run contract tests**

Run:

```powershell
python -m unittest skills.article-visual-director.scripts.tests.test_skill_contract -v
```

Expected: all tests pass.

### Task 4: Approve and migrate golden assets

**Files:**
- Modify after approval: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-cover.png`
- Modify after approval: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-concept.png`
- Modify after approval: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-set.json`

**Interfaces:**
- Consumes: User-approved human-free cover and concept candidates.
- Produces: Approved v2 cover/concept anchors with consistent SHA-256 metadata.

- [ ] **Step 1: Show the two candidates**

Present the existing human-free preview candidates without changing official assets. Ask the user to approve or request corrections.

- [ ] **Step 2: Replace only approved assets**

Copy the approved PNGs into the official cover/concept paths. Keep the diagram PNG unchanged.

- [ ] **Step 3: Update golden metadata**

Increment the golden set version, use `cover-v2` and `concept-v2` identifiers, update prompt and artifact SHA-256 values, change reference roles to non-human teaching-composition anchors, and record the user's approval of the human-free migration.

- [ ] **Step 4: Validate hashes and pack qualification**

Run the repository's Style 8 contract validators and assert that every stored hash matches the current file.

### Task 5: Full verification, commit, and push

**Files:**
- Verify all files changed in Tasks 1-4 plus the earlier article-density changes already in the worktree.

**Interfaces:**
- Consumes: Green focused tests and approved golden files.
- Produces: A clean, pushed branch containing the requested fixes without unrelated cache files.

- [ ] **Step 1: Run full verification**

Run the full article-visual-director unittest suite, benchmark checks, Style Pack validators, `quick_validate.py`, `git diff --check`, and source/installed hash comparison.

- [ ] **Step 2: Inspect staged scope**

Stage only intended source, test, benchmark, spec, plan, prompt, contract, and approved golden files. Exclude `__pycache__` and unrelated user changes.

- [ ] **Step 3: Commit**

Create focused commits for the Style 8 contract/golden migration and remaining verified density work.

- [ ] **Step 4: Push**

Push `codex/narrow-style9-image-runtime-fix` to its configured GitHub remote and report the commit IDs and remote branch.
