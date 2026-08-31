# Style 9 Dense Technical Infographic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add and qualify `Dense Technical Infographic（高密度技术信息图）` as the ninth `article-visual-director` mode, using the latest `gpt-image-2` alias for native text-bearing technical posters under a narrow fail-closed validation exception.

**Architecture:** Register Style 9 as a candidate Style Pack v3, add a profile-scoped native-text policy to the existing Prompt IR compiler and manifest validator, then produce and explicitly approve cover, concept, and diagram goldens in sequence. Promote the pack only after exact-copy checks, frozen-graph validation, cross-topic probes, neighbor discrimination, release validation, and the full regression suite pass.

**Tech Stack:** Python 3 standard library, JSON Style Pack contracts, Markdown protocols, GPT Image adapter, GPT Image 2 via the host image-generation capability, PNG artifacts, optional SVG local correction, `unittest`, Git.

## Global Constraints

- Public identity is exactly `Dense Technical Infographic（高密度技术信息图）`; profile ID is exactly `dense-technical-infographic`; ordinal is exactly `9`.
- Model alias is exactly `gpt-image-2` with selection policy `latest-alias`; record runtime-reported identity without inventing a snapshot.
- Initial registry and golden status is `candidate`; remove the candidate flag only after three explicit user approvals and release qualification.
- Native generated copy is allowed only for Style 9 with a frozen exact-copy ledger and mandatory post-generation validation.
- Diagram generation additionally requires a valid frozen semantic graph before any image call.
- Correct native text is preserved; one isolated copy defect may receive a deterministic local correction; topology, direction, grouping, numeric, or multiple-copy defects require regeneration or deterministic rebuild.
- User-supplied Nginx, ZLMediaKit, Netty, and Spring images are temporary visual references only and must not be committed or treated as semantic authority.
- Golden content remains non-authoritative: labels, numbers, nodes, topology, icons, layout, and example story must not propagate to later articles.
- Do not modify the existing eight modes beyond menu, registry, schema, and neighbor-boundary changes required for Style 9.
- Use TDD for compiler and validator changes. Each golden role has a separate user approval checkpoint.
- Use `apply_patch` for text files, preserve unrelated worktree changes, and never overwrite the CSDN source article.

---

## File Map

**Create**

- `skills/article-visual-director/references/styles/09-dense-technical-infographic.md` — human-readable Style 9 protocol.
- `skills/article-visual-director/references/styles/09-dense-technical-infographic.tokens.json` — deterministic palette, line, typography, spacing, and semantic tokens.
- `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/visual-dna.json` — cross-role invariants and neighbor boundaries.
- `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/role-contracts.json` — cover, concept, and diagram responsibilities.
- `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/reference-matrix.json` — non-semantic reference inheritance rules.
- `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-set.json` — candidate assets, hashes, approvals, and qualification.
- `evals/golden-production/09-dense-technical-infographic.json` — production audit history.
- `evals/golden-production/09-dense-technical-infographic-cover-request.json` — frozen cover request.
- `evals/golden-production/09-dense-technical-infographic-concept-request.json` — frozen concept request.
- `evals/golden-production/09-dense-technical-infographic-diagram-request.json` — frozen diagram request.
- `evals/style-pack-probes/09-dense-technical-infographic.json` — three cross-topic probes and neighbor discrimination.
- Three golden PNGs and their compiled prompt records under `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/`.

**Modify**

- `skills/article-visual-director/SKILL.md` — nine-mode gate and narrow Style 9 exception.
- `skills/article-visual-director/references/style-registry.json` — candidate registry entry.
- `skills/article-visual-director/references/style-catalog.md` — bilingual public description.
- `skills/article-visual-director/references/style-pack-schema.md` — native-text exception contract.
- `skills/article-visual-director/references/prompt-ir-schema.md` — model policy and native-copy fields.
- `skills/article-visual-director/references/manifest-schema.md` — native-generated cover title and imagegen technical-diagram audit fields.
- `skills/article-visual-director/references/adapters/gpt-image.md` — latest alias and text-bearing generation rules.
- `skills/article-visual-director/scripts/compile_image_prompt.py` — profile-scoped model and text-policy validation.
- `skills/article-visual-director/scripts/validate_manifest.py` — profile-scoped native title and technical imagegen renderer validation.
- `skills/article-visual-director/scripts/tests/test_skill_contract.py` — ninth profile and Visual DNA tests.
- `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py` — positive and negative native-copy tests and Style 9 probes.
- `skills/article-visual-director/scripts/tests/test_validate_manifest.py` — native title and imagegen architecture exception tests.
- Neighbor protocols or probe descriptions for Styles 1, 4, 5, and 8 when the new boundary must be stated explicitly.
- `C:/Users/admin/Documents/文章/开源一个Skill让AI稳定生成一整套配图/开源一个Skill让AI稳定生成一整套配图.md` only after Style 9 release approval.

---

### Task 1: Register the Ninth Candidate Mode

**Files:**

- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py:10`
- Modify: `skills/article-visual-director/references/style-registry.json`
- Modify: `skills/article-visual-director/references/style-catalog.md`
- Modify: `skills/article-visual-director/SKILL.md`

**Interfaces:**

- Consumes: current ordered eight-profile registry and mandatory style-selection menu.
- Produces: one candidate profile discoverable as ordinal 9 without claiming an approved golden set.

- [ ] **Step 1: Write the failing registry and menu test**

Append the exact tuple to `EXPECTED_PROFILES`:

```python
(9, "dense-technical-infographic", "Dense Technical Infographic", "高密度技术信息图"),
```

Add this assertion to `test_style_gate_and_catalog_expose_the_same_eight_profiles`, renaming it to `test_style_gate_and_catalog_expose_the_same_nine_profiles`:

```python
self.assertIn("9. **Dense Technical Infographic（高密度技术信息图）**", skill_text)
self.assertIn("高密度技术信息图", catalog_text)
self.assertEqual(9, len(EXPECTED_PROFILES))
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_skill_contract.py' -v
```

Expected: FAIL because ordinal 9 is absent from the registry, catalog, and Skill menu.

- [ ] **Step 3: Add the candidate registry entry**

Append this exact object to `references/style-registry.json`:

```json
{"ordinal": 9, "profile_id": "dense-technical-infographic", "name_en": "Dense Technical Infographic", "name_zh": "高密度技术信息图", "protocol_version": 2, "protocol_path": "references/styles/09-dense-technical-infographic.md", "tokens_path": "references/styles/09-dense-technical-infographic.tokens.json", "golden_set_path": "assets/style-anchors/dense-technical-infographic/golden-set.json", "style_pack_version": 3, "style_pack_status": "candidate", "visual_dna_path": "assets/style-anchors/dense-technical-infographic/visual-dna.json", "role_contracts_path": "assets/style-anchors/dense-technical-infographic/role-contracts.json", "reference_matrix_path": "assets/style-anchors/dense-technical-infographic/reference-matrix.json", "adapter_ids": ["gpt-image"]}
```

- [ ] **Step 4: Add the public menu copy**

Add this exact ninth menu item in `SKILL.md` and update prose that says “eight” to “nine” only where it refers to the registered menu:

```markdown
9. **Dense Technical Infographic（高密度技术信息图）** — 白底、深海军蓝标题、扁平矢量图标、高密度分区与底部总结栏，适合框架原理、中间件、网络协议、并发模型和系统架构教程。
```

Add the same identity and a one-paragraph boundary summary to `style-catalog.md`, explicitly distinguishing it from Styles 1, 4, 5, and 8.

- [ ] **Step 5: Run the registry test**

Run the same command from Step 2.

Expected: PASS.

- [ ] **Step 6: Commit the candidate registration**

```powershell
git add -- 'skills/article-visual-director/SKILL.md' 'skills/article-visual-director/references/style-registry.json' 'skills/article-visual-director/references/style-catalog.md' 'skills/article-visual-director/scripts/tests/test_skill_contract.py'
git commit -m "feat(article-visual-director): register dense technical infographic candidate"
```

---

### Task 2: Add the Style Pack v3 Contracts

**Files:**

- Create: `skills/article-visual-director/references/styles/09-dense-technical-infographic.md`
- Create: `skills/article-visual-director/references/styles/09-dense-technical-infographic.tokens.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/visual-dna.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/role-contracts.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/reference-matrix.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-set.json`
- Create: `evals/golden-production/09-dense-technical-infographic.json`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**

- Consumes: Style Pack v3 schema, candidate bootstrap protocol, approved design specification.
- Produces: complete candidate contracts loadable by `compile_prompt_ir()` and protocol validation.

- [ ] **Step 1: Write the failing Style 9 identity test**

Add:

```python
def test_style_9_v3_preserves_dense_technical_infographic_identity(self) -> None:
    root = SKILL_ROOT / "assets" / "style-anchors" / "dense-technical-infographic"
    visual = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
    roles = json.loads((root / "role-contracts.json").read_text(encoding="utf-8"))
    references = json.loads((root / "reference-matrix.json").read_text(encoding="utf-8"))
    combined = json.dumps([visual, roles, references], ensure_ascii=False)
    for phrase in (
        "fully opaque pure white",
        "oversized deep navy title",
        "flat vector-like",
        "eighty-five to ninety-two percent",
        "bottom takeaway rail",
        "native generated copy",
        "mechanism-poster",
        "architecture-flow",
        "layered-comparison",
        "no people",
        "Style 4",
        "Style 8",
    ):
        self.assertIn(phrase, combined)
    self.assertEqual({"cover", "concept", "diagram"}, set(roles["roles"]))
    self.assertEqual(3, len(references["references"]))
```

- [ ] **Step 2: Run the test and verify missing-contract failure**

Run:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_skill_contract.py' -v
```

Expected: ERROR with `FileNotFoundError` for the Style 9 pack.

- [ ] **Step 3: Create the deterministic tokens**

Create `09-dense-technical-infographic.tokens.json` with this complete object:

```json
{
  "profile_id": "dense-technical-infographic",
  "protocol_version": 2,
  "surface": {"background": "#FFFFFF", "panel": "#F8FBFF", "boundary": "#B8D0F4", "finish": "clean-flat-technical-poster"},
  "palette": {"ink": "#071A3D", "primary": "#1769C2", "success": "#238636", "attention": "#D96C00", "extension": "#5B3FA3", "failure": "#D1242F", "neutral": "#59677D", "saturation": "semantic-controlled"},
  "line": {"primary": "#1769C2", "width_px": 2, "secondary_width_px": 1, "container_width_px": 2, "behavior": "crisp-direct-vector-path"},
  "typography": {"family_zh": "Microsoft YaHei, PingFang SC, sans-serif", "family_en": "Inter, IBM Plex Sans, Arial, sans-serif", "title_weight": 850, "section_weight": 750, "label_weight": 650, "label_treatment": "native-generated-copy-with-exact-validation"},
  "geometry": {"corner_radius_px": 18, "module_radius_px": 12, "number_disc_px": 44, "shape_language": "flat-numbered-engineering-poster", "camera": "strict-front-facing-flat"},
  "depth": {"mode": "flat-vector-like", "shadow": "minimal-soft-card-separation", "glow": "none"},
  "texture": {"pattern": "none", "intensity": "none"},
  "spacing": {"grid_px": 20, "outer_margin_px": 36, "module_gap_px": 24, "density": "high-organized", "occupancy": "85-92-percent"},
  "semantic_color_roles": {"normal": "#1769C2", "success": "#238636", "conclusion": "#D96C00", "configuration": "#5B3FA3", "failure": "#D1242F", "secondary_copy": "#59677D"},
  "forbidden_traits": ["glass acrylic", "3D isometric", "handwritten paper", "cyberpunk", "people", "decorative AI brain", "meaningless dashboard", "unsupported topology"]
}
```

- [ ] **Step 4: Create Visual DNA and role contracts**

Create `visual-dna.json` with all Style Pack schema keys. Use these exact observable invariants:

```json
{
  "profile_id": "dense-technical-infographic",
  "style_pack_version": 3,
  "identity": {"name_en": "Dense Technical Infographic", "name_zh": "高密度技术信息图", "promise": "turn verified technical content into a high-density text-bearing engineering teaching poster"},
  "surface": {"background": "fully opaque pure white or slightly cool-white canvas", "panels": "pale blue or white rounded information regions", "finish": "clean flat technical poster without grid paper or environmental scene"},
  "palette_roles": {"ink": "deep navy carries the oversized title", "primary": "royal blue carries normal structure and the main path", "success": "engineering green carries supported success and benefit", "attention": "orange carries conclusions and explicit attention", "extension": "purple carries supported configuration or modularity", "failure": "red carries supported failure or danger", "neutral": "cool gray carries secondary copy"},
  "line_language": {"primary": "crisp two-pixel direct arrows", "secondary": "one-pixel separators and dashed group boundaries", "icons": "flat vector-like technical icons with consistent stroke and fill"},
  "material_and_texture": {"material": "flat vector-like cards and icons", "shadow": "minimal soft separation only", "forbidden_depth": "no glass acrylic chrome 3D isometric or environmental depth"},
  "geometry": {"families": ["mechanism-poster", "architecture-flow", "layered-comparison"], "zones": "three to six numbered explanatory zones", "nucleus": "one central mechanism or architecture", "summary": "one full-width bottom takeaway rail"},
  "depth_and_camera": {"camera": "strict front-facing flat composition", "perspective": "none", "lighting": "neutral white with no dramatic glow"},
  "typography": {"title": "oversized deep navy title", "copy": "clean technical sans-serif Chinese and English", "workflow": "native generated copy is preserved only after exact validation"},
  "density_and_spacing": {"occupancy": "eighty-five to ninety-two percent", "density": "high but organized", "reading_order": "title then central mechanism then numbered zones then bottom takeaway rail"},
  "required_traits": ["fully opaque pure white technical poster", "oversized deep navy title and clear central mechanism", "flat vector-like icons and rounded numbered zones", "high organized density with a bottom takeaway rail", "native generated copy receives exact post-generation validation"],
  "forbidden_traits": ["no people mascots narrators or hands", "no glass acrylic chrome 3D or isometric depth", "no handwritten paper watercolor sketch or comic treatment", "no cyberpunk HUD code rain hologram or decorative AI brain", "no unsupported text numbers nodes arrows states metrics or topology"],
  "neighbor_boundaries": [
    {"profile_id": "technical-editorial-minimal", "difference": "Style 9 is a dense numbered teaching poster; Style 1 is sparse technical editorial illustration."},
    {"profile_id": "blueprint-linework", "difference": "Style 9 is flat and text-forward; Style 4 uses polished product depth for covers and concepts."},
    {"profile_id": "isometric-infrastructure", "difference": "Style 9 is front-facing and flat; Style 5 is a fixed-isometric matte world."},
    {"profile_id": "handwritten-systems-explainer", "difference": "Style 9 uses crisp vector-like geometry and sans-serif copy; Style 8 uses warm paper and lively handwritten annotation."}
  ]
}
```

Create `role-contracts.json` with `cover.stability="family"`, `concept.stability="family"`, and `diagram.stability="strict"`. Each role must contain non-empty `must_preserve`, `may_vary`, `must_not_include`, and `acceptance_checks`. Copy the approved role requirements verbatim from the design spec; include the literal family names and require exact copy validation for all roles plus frozen-graph equality for the diagram.

- [ ] **Step 5: Create the reference matrix and candidate golden set**

Create a three-entry reference matrix using IDs:

```json
[
  {"golden_asset_id": "dense-technical-infographic-cover-v1", "role": "cover"},
  {"golden_asset_id": "dense-technical-infographic-concept-v1", "role": "concept"},
  {"golden_asset_id": "dense-technical-infographic-diagram-v1", "role": "diagram"}
]
```

For every entry, add non-empty `must_preserve` and `may_vary`, and set `must_not_copy` to exactly include `labels`, `numbers`, `nodes`, `topology`, `icons`, and `example_story`.

Compute the contract hashes before creating `golden-set.json`:

```powershell
$pack='skills/article-visual-director/assets/style-anchors/dense-technical-infographic'
$visualHash=(Get-FileHash -LiteralPath "$pack/visual-dna.json" -Algorithm SHA256).Hash.ToLowerInvariant()
$rolesHash=(Get-FileHash -LiteralPath "$pack/role-contracts.json" -Algorithm SHA256).Hash.ToLowerInvariant()
$matrixHash=(Get-FileHash -LiteralPath "$pack/reference-matrix.json" -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Output "visual_dna_sha256=$visualHash"
Write-Output "role_contracts_sha256=$rolesHash"
Write-Output "reference_matrix_sha256=$matrixHash"
```

Create `golden-set.json` with the printed lowercase values, `golden_set_version=1`, matching profile/protocol/pack versions, all three qualification fields `pending`, `status=candidate`, `user_approval.status=pending`, an empty revision-note array, and an empty asset array. Before staging, verify each stored hash equals a fresh `Get-FileHash` result.

- [ ] **Step 6: Create the protocol and production audit**

Write the protocol with sections `Identity`, `Use When`, `Do Not Use When`, `Nearest Neighbors`, `Visual DNA`, `Composition Families`, `Cover`, `Concept`, `Diagram`, `Prompt Requirements`, `Reference Use`, and `Acceptance`. Use only the approved design decisions.

Initialize the audit file with:

```json
{
  "golden_production_version": 1,
  "profile_id": "dense-technical-infographic",
  "style_pack_version": 3,
  "status": "in_progress",
  "program_outcome": "Candidate contract registered; three GPT Image 2 goldens remain subject to explicit user approval and qualification.",
  "candidates": []
}
```

- [ ] **Step 7: Run contract tests and protocol validation**

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
$py='C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_skill_contract.py' -v
& $py 'skills/article-visual-director/scripts/validate_style_contract.py' --phase protocol --profile dense-technical-infographic
```

Expected: both commands PASS; release validation still fails because the pack is a candidate without approved assets.

- [ ] **Step 8: Commit the Style Pack contracts**

Stage only the new Style 9 contracts, audit file, and updated contract test. Commit:

```powershell
git commit -m "feat(article-visual-director): add style 9 visual contracts"
```

---

### Task 3: Add the GPT Image 2 Native-Copy Prompt Policy

**Files:**

- Modify: `skills/article-visual-director/scripts/compile_image_prompt.py:290-315`
- Modify: `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`
- Modify: `skills/article-visual-director/references/prompt-ir-schema.md`
- Modify: `skills/article-visual-director/references/style-pack-schema.md`
- Modify: `skills/article-visual-director/references/adapters/gpt-image.md`
- Modify: `skills/article-visual-director/SKILL.md`

**Interfaces:**

- Consumes: request fields `model_policy` and `text_policy`.
- Produces: Prompt IR output contract containing the model policy and a validated Style 9 native-copy exception.

- [ ] **Step 1: Write positive and negative native-copy tests**

Add test helpers that mutate a valid Style 9 cover request to use:

```python
request["model_policy"] = {
    "alias": "gpt-image-2",
    "selection": "latest-alias",
    "runtime_identity": "record-if-returned",
}
request["text_policy"] = {
    "mode": "native-generated-copy-with-validation",
    "exact_text": ["高并发服务：一次请求如何被稳定处理", "流量入口", "任务调度"],
    "copy_ledger_status": "frozen",
    "native_text_generation": True,
    "post_generation_validation": "exact",
    "deterministic_overlay": False,
    "fallback_policy": "correct-one-isolated-copy-defect-otherwise-regenerate",
}
```

Assert Style 9 lints cleanly. Then change `profile_id` to `blueprint-linework` and assert `TEXT_POLICY_VIOLATION`. Add separate failures for `alias="chatgpt-image-latest"`, missing `copy_ledger_status`, and missing `post_generation_validation`.

- [ ] **Step 2: Run the tests and verify the current deterministic-only rule fails Style 9**

Run:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_compile_image_prompt.py' -v
```

Expected: new Style 9 positive test fails with `TEXT_POLICY_VIOLATION`.

- [ ] **Step 3: Implement profile-scoped validators**

Add:

```python
NATIVE_TEXT_PROFILE_ID = "dense-technical-infographic"


def _valid_latest_image_model_policy(value: object) -> bool:
    return (
        isinstance(value, dict)
        and value.get("alias") == "gpt-image-2"
        and value.get("selection") == "latest-alias"
        and value.get("runtime_identity") == "record-if-returned"
    )


def _valid_native_text_policy(profile_id: object, value: object) -> bool:
    return (
        profile_id == NATIVE_TEXT_PROFILE_ID
        and isinstance(value, dict)
        and value.get("mode") == "native-generated-copy-with-validation"
        and isinstance(value.get("exact_text"), list)
        and bool(value["exact_text"])
        and all(isinstance(item, str) and item.strip() for item in value["exact_text"])
        and value.get("copy_ledger_status") == "frozen"
        and value.get("native_text_generation") is True
        and value.get("post_generation_validation") == "exact"
        and value.get("deterministic_overlay") is False
        and value.get("fallback_policy")
        == "correct-one-isolated-copy-defect-otherwise-regenerate"
    )
```

Replace the current exact-text lint branch with:

```python
if exact_text and not text_policy.get("deterministic_overlay"):
    if not _valid_native_text_policy(prompt_ir.get("profile_id"), text_policy):
        errors.append(
            _error(
                "TEXT_POLICY_VIOLATION",
                "text_policy",
                "Exact text requires deterministic overlay unless the registered Style 9 native-copy policy is frozen and exact validation is mandatory.",
            )
        )
```

For Style 9, require `_valid_latest_image_model_policy(prompt_ir["output_contract"].get("model_policy"))`; emit `STYLE_IDENTITY_DRIFT` otherwise. Add `"model_policy": request.get("model_policy")` to `output_contract`.

- [ ] **Step 4: Document the narrow exception**

Update the three schema/adapter documents and `SKILL.md` with these exact rules:

- all profiles still default to deterministic exact typography;
- only `dense-technical-infographic` may generate exact native copy;
- the copy ledger is `text_policy.exact_text` with `copy_ledger_status=frozen`;
- model alias must be `gpt-image-2` and selection `latest-alias`;
- diagrams still require `semantics.frozen_graph`;
- validation failure never falls back to accepting wrong text.

- [ ] **Step 5: Run compiler and contract tests**

Run:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
$py='C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_compile_image_prompt.py' -v
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_skill_contract.py' -v
```

Expected: PASS, including the existing non-Style-9 deterministic-text test.

- [ ] **Step 6: Commit the Prompt IR policy**

```powershell
git commit -m "feat(article-visual-director): support validated style 9 native copy"
```

---

### Task 4: Add Manifest Validation for Native Covers and Imagegen Technical Diagrams

**Files:**

- Modify: `skills/article-visual-director/scripts/validate_manifest.py:34-52,736-815,1015-1140`
- Modify: `skills/article-visual-director/scripts/tests/test_validate_manifest.py`
- Modify: `skills/article-visual-director/references/manifest-schema.md`

**Interfaces:**

- Consumes: manifest `style.profile_id`, `asset.renderer`, `asset.title`, and `asset.native_text_validation`.
- Produces: a fail-closed Style 9 exception for native-generated cover titles and imagegen process/architecture/comparison/timeline assets.

- [ ] **Step 1: Write failing manifest tests**

Add a valid Style 9 fixture with:

```python
data["style"]["profile_id"] = "dense-technical-infographic"
asset["role"] = "architecture"
asset["renderer"] = "imagegen"
asset["native_text_validation"] = {
    "status": "passed",
    "copy_ledger_status": "frozen",
    "visible_copy_status": "exact-match",
    "semantic_graph_status": "exact-match",
    "review_notes": "Every visible label, node, edge, direction, group, and invariant matches the approved ledgers.",
}
```

Assert it passes integration. Change profile ID to Style 4 and assert `renderer_role_mismatch`. Remove `semantic_graph_status` and assert `native_text_validation_invalid`.

Add a Style 9 WeChat cover fixture with:

```python
asset["title"] = {
    "mode": "native-generated",
    "text_lines": ["高并发服务：一次请求如何被稳定处理"],
    "supporting_points": ["限流", "隔离", "缓存", "降级"],
    "wide_crop_checked": True,
    "square_crop_checked": True,
}
asset["native_text_validation"] = {
    "status": "passed",
    "copy_ledger_status": "frozen",
    "visible_copy_status": "exact-match",
    "semantic_graph_status": "not-required",
    "review_notes": "Exact title and supporting copy verified at full resolution.",
}
```

Assert it passes without an editable SVG or background artifact. Assert the same title mode fails for every other profile.

- [ ] **Step 2: Run tests and verify the current renderer/title rules fail**

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_validate_manifest.py' -v
```

Expected: Style 9 architecture fails `renderer_role_mismatch`; native cover fails `invalid_cover_title_mode`.

- [ ] **Step 3: Implement profile-aware renderer validation**

Pass `style_profile_id` into `_validate_asset()`. Add:

```python
NATIVE_TEXT_PROFILE_ID = "dense-technical-infographic"
NATIVE_IMAGEGEN_ROLES = {"process", "architecture", "comparison", "timeline"}


def _renderer_matches_role(role: object, renderer: object, profile_id: object) -> bool:
    if (
        profile_id == NATIVE_TEXT_PROFILE_ID
        and role in NATIVE_IMAGEGEN_ROLES
        and renderer == "imagegen"
    ):
        return True
    return role not in ROLE_RENDERER or renderer == ROLE_RENDERER[role]
```

Replace the direct `ROLE_RENDERER` equality branch with `_renderer_matches_role()`.

Add a validator that requires the exact `native_text_validation` keys above, `status="passed"` during integration, `copy_ledger_status="frozen"`, `visible_copy_status="exact-match"`, and `semantic_graph_status="exact-match"` for technical diagram roles.

- [ ] **Step 4: Implement native-generated cover title validation**

Add `native-generated` to `VALID_COVER_TITLE_MODES`. Pass `style_profile_id` into `_validate_cover_title()`, allow the new mode only when it equals `dense-technical-infographic`, and require non-empty `text_lines`, one to four optional `supporting_points`, crop checks, and the passed native-text validation record. Do not require `editable_source_path` or `background_artifact_path` for this mode.

- [ ] **Step 5: Document the manifest contract and run tests**

Update `manifest-schema.md` with the exact `native_text_validation` object and the Style 9-only renderer/title conditions. Run:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
$py='C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_validate_manifest.py' -v
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_*.py'
```

Expected: all tests PASS.

- [ ] **Step 6: Commit the manifest exception**

```powershell
git commit -m "feat(article-visual-director): validate native style 9 diagrams"
```

---

### Task 5: Produce and Approve the Golden Cover

**Files:**

- Create: `evals/golden-production/09-dense-technical-infographic-cover-request.json`
- Create after compilation: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-cover.prompt-ir.json`
- Create after compilation: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-cover.prompt.md`
- Create after generation: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-cover.png`
- Modify: `evals/golden-production/09-dense-technical-infographic.json`
- Modify after approval: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-set.json`

**Interfaces:**

- Consumes: Style 9 Visual DNA and cover role contract with no permanent or cross-profile image reference.
- Produces: first approved same-profile bootstrap candidate.

- [ ] **Step 1: Freeze the cover request**

Set `profile_id=dense-technical-infographic`, `asset_role=cover`, `golden_reference_ids=[]`, `golden_production.stage=cover`, `bootstrap_references=[]`, and `semantic_authority=false`.

Use this exact copy ledger:

```json
[
  "高并发服务：一次请求如何被稳定处理",
  "流量入口",
  "任务调度",
  "服务执行",
  "异常保护",
  "限流",
  "隔离",
  "缓存",
  "降级"
]
```

The objective must request `mechanism-poster`, one central request-processing core, four numbered zones, royal-blue primary logic, green supported output, orange exception protection, one bottom rail, 16:9, fully opaque white, and no vendor branding or performance numbers.

- [ ] **Step 2: Compile and lint the request**

```powershell
$py='C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py 'skills/article-visual-director/scripts/compile_image_prompt.py' --request 'evals/golden-production/09-dense-technical-infographic-cover-request.json' --out-ir 'skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-cover.prompt-ir.json' --out-prompt 'skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-cover.prompt.md'
```

Expected: `{"overall":"passed"}` and all eight Prompt IR blocks exactly once.

- [ ] **Step 3: Generate with the latest GPT Image capability**

Use the compiled prompt verbatim with the host image-generation capability. Do not attach any of the other eight style goldens. The three user references may be supplied only as temporary visual references when the runtime supports them, with an explicit instruction not to copy text, vendors, icons, topology, or layout.

- [ ] **Step 4: Validate the raster before showing it**

Check exact copy, full opacity, 16:9, title hierarchy, four zones, central mechanism, bottom rail, semantic colors, and absence of unsupported content. Record any failure as a rejected candidate; do not overwrite it silently.

- [ ] **Step 5: Show the candidate and stop for explicit user approval**

The approval request must identify it as the Style 9 golden cover candidate. Do not start the concept until the user explicitly approves the displayed cover.

- [ ] **Step 6: Record approval and commit**

After approval, add one `renderer=imagegen` cover asset with artifact and prompt hashes to `golden-set.json`, keep pack status `candidate`, append the approval evidence to the audit, and commit:

```powershell
git commit -m "feat(article-visual-director): approve style 9 golden cover"
```

---

### Task 6: Produce and Approve the Golden Concept

**Files:**

- Create: `evals/golden-production/09-dense-technical-infographic-concept-request.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-concept.prompt-ir.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-concept.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-concept.png`
- Modify: Style 9 audit and golden set.

**Interfaces:**

- Consumes: explicitly approved Style 9 cover as one non-semantic bootstrap reference.
- Produces: approved concept anchor distinct from the cover composition.

- [ ] **Step 1: Freeze the concept request and copy ledger**

Use `layered-comparison` and this exact copy ledger:

```json
[
  "背压机制：让生产速度服从处理能力",
  "没有背压",
  "持续生产",
  "队列积压",
  "处理延迟上升",
  "引入背压",
  "消费能力",
  "缓冲水位",
  "反馈信号",
  "保护内存",
  "稳定延迟",
  "降低级联故障风险"
]
```

Declare one approved cover bootstrap reference with `semantic_authority=false`. Block the cover's central-core/four-zone topology and all reference example content.

- [ ] **Step 2: Compile, generate, and validate**

Compile through `compile_image_prompt.py`; attach only the approved Style 9 cover candidate as visual evidence. Validate every native string, the upper/lower comparison, feedback direction, and non-absolute wording.

- [ ] **Step 3: Show the candidate and stop for explicit user approval**

Do not generate the diagram until the concept is explicitly approved.

- [ ] **Step 4: Record approval and commit**

Add the concept artifact and prompt hashes, preserve candidate status, append audit evidence, and commit:

```powershell
git commit -m "feat(article-visual-director): approve style 9 golden concept"
```

---

### Task 7: Produce and Approve the Golden Diagram

**Files:**

- Create: `evals/golden-production/09-dense-technical-infographic-diagram-request.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-diagram.prompt-ir.json`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-diagram.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/dense-technical-infographic/golden-diagram.png`
- Modify: Style 9 audit and golden set.

**Interfaces:**

- Consumes: explicitly approved Style 9 concept as one non-semantic bootstrap reference and a frozen graph.
- Produces: approved strict diagram anchor or a recorded rejection when any topology item is wrong.

- [ ] **Step 1: Freeze the diagram graph**

Use these exact nodes:

```json
["task-submission", "validation", "queue", "scheduling", "execution", "result-archive", "retry-decision", "failure-archive"]
```

Use these exact edges:

```json
[
  {"id": "edge-submit-validate", "from": "task-submission", "to": "validation", "type": "primary"},
  {"id": "edge-validate-queue", "from": "validation", "to": "queue", "type": "primary"},
  {"id": "edge-queue-schedule", "from": "queue", "to": "scheduling", "type": "primary"},
  {"id": "edge-schedule-execute", "from": "scheduling", "to": "execution", "type": "primary"},
  {"id": "edge-execute-result", "from": "execution", "to": "result-archive", "type": "primary"},
  {"id": "edge-execute-retry", "from": "execution", "to": "retry-decision", "type": "exception"},
  {"id": "edge-retry-queue", "from": "retry-decision", "to": "queue", "type": "return"},
  {"id": "edge-retry-failure", "from": "retry-decision", "to": "failure-archive", "type": "exception"}
]
```

Invariants:

```json
[
  "result-archive is reachable only from execution",
  "failure-archive is reachable only from retry-decision",
  "retry-decision may return only to queue",
  "no failure state reaches result-archive directly"
]
```

Use exact Chinese labels matching the approved title and eight nodes. Do not include retry counts, timing, vendors, executors, databases, or notification nodes.

- [ ] **Step 2: Compile and generate**

Compile through the Style 9 policy, then generate with only the approved concept as bootstrap visual evidence. Require `architecture-flow`, blue primary path, orange failure entry, blue return path, red failure archive, green result archive, numbered sections, legend, and bottom invariant rail.

- [ ] **Step 3: Perform exact topology audit**

Count eight nodes and eight edges. Trace every arrowhead source and destination. Verify the two archives, the retry return, and every Chinese label. A misplaced arrowhead, missing node, duplicated label, or invented state is rejection even when the image is attractive.

- [ ] **Step 4: Show the candidate and stop for explicit user approval**

Do not qualify or promote the pack until the user explicitly approves the displayed diagram.

- [ ] **Step 5: Record approval and commit**

Add the imagegen diagram asset and hashes, append topology-audit evidence, and commit:

```powershell
git commit -m "feat(article-visual-director): approve style 9 golden diagram"
```

---

### Task 8: Add Cross-Topic Probes and Promote the Pack

**Files:**

- Create: `evals/style-pack-probes/09-dense-technical-infographic.json`
- Modify: `skills/article-visual-director/scripts/tests/test_compile_image_prompt.py`
- Modify: neighbor descriptions for Styles 1, 4, 5, and 8 only where missing.
- Modify: Style 9 golden set, registry, and production audit.

**Interfaces:**

- Consumes: three explicitly approved Style 9 goldens.
- Produces: passed prompt compile, cross-topic, neighbor discrimination, and release status.

- [ ] **Step 1: Write the failing probe-suite test**

Add `Style9ProbeSuiteTests` modeled on the existing suites. Require exactly three roles, all eight Prompt IR blocks, exact native-copy policy, `gpt-image-2`, all non-copy fields, and neighbor IDs `{technical-editorial-minimal, blueprint-linework, isometric-infrastructure, handwritten-systems-explainer}`.

- [ ] **Step 2: Create the three probes**

Use these unrelated topics:

- cover: database read/write separation and failover roles;
- concept: idempotency keys preventing duplicate side effects;
- diagram: event ingestion with validation, dead-letter routing, replay, and audit.

Each probe must use a fresh copy ledger and, for the diagram, a graph that does not copy the golden lifecycle topology.

- [ ] **Step 3: Compile and lint all probes**

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
$py='C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_compile_image_prompt.py' -v
```

Expected: PASS.

- [ ] **Step 4: Update qualification and approval status**

Set all qualification fields to `passed`, set `golden-set.status=approved`, set `user_approval.status=approved`, add the three explicit approval notes, remove `style_pack_status=candidate` from the registry, and set audit `status=approved`.

- [ ] **Step 5: Run release and full regression validation**

```powershell
$env:TEMP='C:\tmp'
$env:TMP='C:\tmp'
$env:PYTHONDONTWRITEBYTECODE='1'
$py='C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $py 'skills/article-visual-director/scripts/validate_style_contract.py' --phase release --profile dense-technical-infographic
& $py -m unittest discover -s 'skills/article-visual-director/scripts/tests' -p 'test_*.py'
git diff --check
```

Expected: release `overall=passed`, all tests PASS, and no whitespace errors.

- [ ] **Step 6: Commit qualification**

```powershell
git commit -m "feat(article-visual-director): qualify dense technical infographic style"
```

---

### Task 9: Update Public Documentation, Verify Installation, and Push

**Files:**

- Modify: `C:/Users/admin/Documents/文章/开源一个Skill让AI稳定生成一整套配图/开源一个Skill让AI稳定生成一整套配图.md`
- Create: `C:/Users/admin/Documents/文章/开源一个Skill让AI稳定生成一整套配图/assets/style-09-dense-technical-infographic.png`
- Modify repository documentation only where it still claims exactly eight modes.

**Interfaces:**

- Consumes: fully approved and release-qualified Style 9 pack.
- Produces: nine-mode CSDN article, clean repository, pushed current branch, and verified local installed Skill.

- [ ] **Step 1: Update the CSDN article non-destructively**

Change the mode count from eight to nine, add a Style 9 section using the approved golden cover, explain the native-copy validation exception, and keep the file pure Markdown. Do not remove the existing eight sections.

- [ ] **Step 2: Validate the article**

Require exactly nine local Markdown image references, all files present, no `<html>`, `<div>`, or `<style>` tags, and no candidate/unfinished wording for Style 9.

- [ ] **Step 3: Re-run final verification after documentation changes**

Run release validation, the full test suite, image dimension/opacity checks for all three Style 9 goldens, and `git diff --check`.

- [ ] **Step 4: Commit repository documentation changes**

Stage only repository files related to Style 9. The local CSDN article is not part of the `thinking-skills` commit. Commit:

```powershell
git commit -m "docs(article-visual-director): document ninth visual mode"
```

- [ ] **Step 5: Push the current branch**

```powershell
git push origin agent/article-visual-director-style-modes
```

Expected: remote branch advances to the final Style 9 commit.

- [ ] **Step 6: Verify the installed local Skill**

Compare SHA-256 for repository and installed copies of `SKILL.md`, Style 9 `golden-set.json`, and Style 9 `visual-dna.json` under `C:/Users/admin/.agents/skills/thinking-skills/article-visual-director/`. Report exact match status; do not claim the local Skill is current unless all three hashes match.

---

## Execution Checkpoints

Implementation must stop and wait for the user at these exact points:

1. golden cover candidate displayed;
2. golden concept candidate displayed;
3. golden diagram candidate displayed;
4. any regenerated replacement for a rejected candidate.

The user approving one role never approves the next unseen role or the final pack promotion.
