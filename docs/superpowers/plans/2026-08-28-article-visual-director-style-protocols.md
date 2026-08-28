# Article Visual Director Stable Style Protocols Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing eight article visual modes into versioned, reference-backed protocols that keep imagegen and deterministic diagrams visually consistent without breaking Manifest v1.

**Architecture:** Keep `SKILL.md` as the shared workflow and move mode-specific decisions into eight independently loadable protocol documents plus machine-readable token files. Add a canonical registry, a golden-set validator, and Manifest v2 validation; produce each mode's three-image golden set through an explicit user approval gate before that mode becomes production-ready.

**Tech Stack:** Markdown, JSON, Python 3 standard library for validation and integration, Pillow only for the optional deterministic golden-diagram renderer, Codex image generation for raster candidates, `unittest` for regression tests.

## Global Constraints

- Repository root: `D:\csdn\D1-D3\thinking-skills`.
- Preserve the existing order, English names, Chinese names, and profile IDs of all eight modes.
- New article manifests use `manifest_version: 2`; existing legal v1 manifests remain valid and integrable without migration.
- Every production-ready profile requires exactly three user-approved, project-generated golden assets: cover, concept, and diagram.
- Historical user-owned images may guide generation but never become approved golden assets automatically.
- `publication_theme`, `visual_profile`, and `asset_semantics` remain separate; `publication_theme=green` cannot silently replace profile palette, line, material, geometry, or perspective.
- Any article plan containing `imagegen`, article-specific references, or a changed protocol/golden version requires an approved article style anchor before batch rendering.
- A single deterministic asset may use `article_style_anchor=not_required` only when the selected approved protocol is current and no article-specific reference is present.
- User approval is authoritative for golden sets and article anchors; automated validation records evidence but does not decide taste.
- Do not add third-party image assets, network dependencies, or image-generation calls to unit tests.
- Preserve the current non-destructive Markdown integration, path containment, BOM, line-ending, idempotency, title, and crop contracts.
- Do not delete or commit the existing untracked `__pycache__` directories.

---

### Task 1: Lock the Canonical Eight-Profile Registry

**Files:**
- Create: `skills/article-visual-director/references/style-registry.json`
- Create: `skills/article-visual-director/references/style-protocol-schema.md`
- Modify: `skills/article-visual-director/references/style-catalog.md`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: The existing bilingual menu in `SKILL.md` and profile headings in `style-catalog.md`.
- Produces: A canonical ordered registry with `id`, `ordinal`, bilingual names, protocol path, token path, and golden-set path for every mode.

- [ ] **Step 1: Add a failing registry contract test**

Add imports for `json` and define the exact expected profile list:

```python
EXPECTED_PROFILES = [
    (1, "technical-editorial-minimal", "Technical Editorial Minimal", "技术编辑简约"),
    (2, "white-green-editorial-minimal", "White-Green Editorial Minimal", "白底绿色编辑简约"),
    (3, "neon-systems", "Neon Systems", "霓虹系统科技"),
    (4, "blueprint-linework", "Blueprint Linework", "蓝图线稿"),
    (5, "isometric-infrastructure", "Isometric Infrastructure", "等距基础设施"),
    (6, "cinematic-conceptual", "Cinematic Conceptual", "电影感概念视觉"),
    (7, "soft-technical-sketch", "Soft Technical Sketch", "柔和技术手绘"),
    (8, "handwritten-systems-explainer", "Handwritten Systems Explainer", "手写系统解释图"),
]

def test_registry_locks_profile_identity_and_paths(self) -> None:
    registry = json.loads((SKILL_DIR / "references" / "style-registry.json").read_text(encoding="utf-8"))
    actual = [
        (item["ordinal"], item["profile_id"], item["name_en"], item["name_zh"])
        for item in registry["profiles"]
    ]
    self.assertEqual(EXPECTED_PROFILES, actual)
    self.assertEqual(8, len({item["profile_id"] for item in registry["profiles"]}))
    for item in registry["profiles"]:
        self.assertTrue((SKILL_DIR / item["protocol_path"]).is_file())
        self.assertTrue((SKILL_DIR / item["tokens_path"]).is_file())
        self.assertTrue(item["golden_set_path"].startswith("assets/style-anchors/"))
```

- [ ] **Step 2: Run the test and verify the registry is missing**

Run:

```powershell
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
```

Expected: FAIL because `references/style-registry.json` does not exist.

- [ ] **Step 3: Create the canonical registry**

Write `style-registry.json` with `registry_version: 1` and the eight exact identities above. Each entry uses:

```json
{
  "ordinal": 1,
  "profile_id": "technical-editorial-minimal",
  "name_en": "Technical Editorial Minimal",
  "name_zh": "技术编辑简约",
  "protocol_version": 2,
  "protocol_path": "references/styles/01-technical-editorial-minimal.md",
  "tokens_path": "references/styles/01-technical-editorial-minimal.tokens.json",
  "golden_set_path": "assets/style-anchors/technical-editorial-minimal/golden-set.json"
}
```

Use the corresponding ordinal and profile ID for entries 2–8; do not change any name from `EXPECTED_PROFILES`.

- [ ] **Step 4: Define the protocol schema and slim the catalog**

`style-protocol-schema.md` must require these headings in every protocol: `Identity`, `Use When`, `Do Not Use When`, `Mode Boundary`, `Required Visual Traits`, `Allowed Variation`, `Forbidden Traits`, `Cover Contract`, `Concept Contract`, `Deterministic Diagram Contract`, `Imagegen Prompt Contract`, `Reference Use Contract`, and `Validation Rubric`.

Change `style-catalog.md` into a summary table that preserves all eight modes and links each mode to its registry-declared protocol. Keep the selection heuristic, but remove duplicated long fingerprints and prompt fragments after the dedicated protocols exist.

- [ ] **Step 5: Run the registry contract test**

Run the same unittest command.

Expected: The identity comparison passes; path assertions may still fail until Task 2 creates protocol and token files.

- [ ] **Step 6: Commit the registry contract**

```powershell
git add skills/article-visual-director/references/style-registry.json skills/article-visual-director/references/style-protocol-schema.md skills/article-visual-director/references/style-catalog.md skills/article-visual-director/scripts/tests/test_skill_contract.py
git commit -m "feat: lock article visual style registry"
```

### Task 2: Author Eight Distinct Protocols and Deterministic Token Sets

**Files:**
- Create: `skills/article-visual-director/references/styles/01-technical-editorial-minimal.md`
- Create: `skills/article-visual-director/references/styles/01-technical-editorial-minimal.tokens.json`
- Create: `skills/article-visual-director/references/styles/02-white-green-editorial-minimal.md`
- Create: `skills/article-visual-director/references/styles/02-white-green-editorial-minimal.tokens.json`
- Create: `skills/article-visual-director/references/styles/03-neon-systems.md`
- Create: `skills/article-visual-director/references/styles/03-neon-systems.tokens.json`
- Create: `skills/article-visual-director/references/styles/04-blueprint-linework.md`
- Create: `skills/article-visual-director/references/styles/04-blueprint-linework.tokens.json`
- Create: `skills/article-visual-director/references/styles/05-isometric-infrastructure.md`
- Create: `skills/article-visual-director/references/styles/05-isometric-infrastructure.tokens.json`
- Create: `skills/article-visual-director/references/styles/06-cinematic-conceptual.md`
- Create: `skills/article-visual-director/references/styles/06-cinematic-conceptual.tokens.json`
- Create: `skills/article-visual-director/references/styles/07-soft-technical-sketch.md`
- Create: `skills/article-visual-director/references/styles/07-soft-technical-sketch.tokens.json`
- Create: `skills/article-visual-director/references/styles/08-handwritten-systems-explainer.md`
- Create: `skills/article-visual-director/references/styles/08-handwritten-systems-explainer.tokens.json`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: `style-registry.json` and `style-protocol-schema.md` from Task 1.
- Produces: Human-readable mode decisions and machine-readable deterministic tokens that later validators and renderers can load independently.

- [ ] **Step 1: Add failing protocol and token tests**

Add tests that load each registry item and assert every required Markdown heading exists. Validate each token JSON contains:

```python
REQUIRED_TOKEN_KEYS = {
    "profile_id", "protocol_version", "surface", "palette", "line",
    "typography", "geometry", "depth", "texture", "spacing",
    "semantic_color_roles", "forbidden_traits"
}
```

Add the explicit Style 7/8 boundary assertion:

```python
soft = load_tokens("soft-technical-sketch")
handwritten = load_tokens("handwritten-systems-explainer")
self.assertEqual("low", soft["palette"]["saturation"])
self.assertEqual("high-accent", handwritten["palette"]["saturation"])
self.assertEqual("fine-soft", soft["line"]["weight_class"])
self.assertEqual("bold-variable", handwritten["line"]["weight_class"])
self.assertNotEqual(soft["geometry"]["label_style"], handwritten["geometry"]["label_style"])
```

- [ ] **Step 2: Run the contract tests and verify all protocol paths fail**

Run:

```powershell
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
```

Expected: FAIL with missing protocol/token files.

- [ ] **Step 3: Write the eight protocols using the exact mode boundaries**

Use the complete required heading set for every file. Encode these non-negotiable identities:

| Profile | Required traits | Forbidden traits |
|---|---|---|
| technical-editorial-minimal | flat editorial grid; crisp geometry; ink blue; one accent; modern sans | hand-drawn strokes; dashboard chrome; 3D |
| white-green-editorial-minimal | white/pale mint; emerald hierarchy; active wide composition; matte flat depth | leaf/sustainability motifs; pale card piles; glassmorphism |
| neon-systems | navy ground; cyan/acid-green signal paths; modular dark system; controlled glow | cyberpunk city; HUD text; rainbow neon |
| blueprint-linework | orthographic construction; disciplined thin lines; blueprint/drafting ground; cutaways | fake dimensions; photorealism; isometric camera |
| isometric-infrastructure | fixed isometric camera; matte modules; consistent scale; one spatial path | random perspective; server clutter; unsupported topology |
| cinematic-conceptual | one metaphor; controlled dramatic light; atmospheric depth; strong silhouette | multi-module infographic; spectacle without thesis; default face |
| soft-technical-sketch | fine pencil/ink; muted watercolor; approachable teaching metaphor; light paper | childish doodles; corporate cards; bold black frame; high saturation |
| handwritten-systems-explainer | bold imperfect black ink; warm paper; saturated orange/blue/green roles; black label tabs; direct arrows | pastel watercolor; corporate flowchart; 3D prism; page-theme green takeover |

Each `Imagegen Prompt Contract` must specify objective, subject/metaphor, composition, line/material behavior, palette roles, aspect ratio, reference-preservation rules, and negative constraints. Each `Deterministic Diagram Contract` must provide exact token mapping for node fill, boundary stroke, arrow, label tab, typography, paper/background, and spacing.

- [ ] **Step 4: Write the eight token JSON files**

Use `protocol_version: 2` and exact matching `profile_id`. Use CSS hex colors and numeric pixel classes suitable for a 1600×900 master. Required distinguishing token values include:

| Profile | Surface | Primary line | Accent system | Geometry/depth |
|---|---|---|---|---|
| technical-editorial-minimal | `#F7F5EF` | `#162536`, 3 px crisp | `#2A7FFF`, warm `#F2A65A` | square/8 px, flat |
| white-green-editorial-minimal | `#FAFFFC` | `#173B2A`, 3 px crisp | emerald `#168A55`, mint `#DDF4E8` | 12 px, matte-flat |
| neon-systems | `#07111F` | `#66E3FF`, 3 px luminous | acid `#B8FF3D`, cyan `#27D8FF` | 10 px, layered-dark |
| blueprint-linework | `#123B66` | `#E6F4FF`, 2 px uniform | cyan `#72D5FF` | 0–4 px, orthographic |
| isometric-infrastructure | `#EEF2F4` | `#243746`, 3 px crisp | blue `#4B8FD8`, amber `#E8A43A` | 8 px, isometric-30deg |
| cinematic-conceptual | `#10151D` | `#DCE6F2`, silhouette class | one accent `#E59A3A` | organic, atmospheric |
| soft-technical-sketch | `#F6F0E3` | `#524A43`, 2 px imperfect | muted blue `#91AFC4`, sage `#A9B99A`, ochre `#C9A56A` | 14 px, flat-paper |
| handwritten-systems-explainer | `#F4F1E6` | `#171717`, 4 px imperfect | orange `#F59E0B`, blue `#66AEE8`, green `#58B978`, red `#D75A4A` | 12 px, flat-notebook |

For Style 8 set `typography.family_zh` to `KaiTi, STKaiti, serif`, `geometry.label_style` to `black-tab`, and `texture.pattern` to `subtle-dot-paper`. For Style 7 set `typography.family_zh` to a friendly readable serif/sans fallback, `geometry.label_style` to `open-caption`, and prohibit black tabs.

- [ ] **Step 5: Run the complete skill contract tests**

Run the unittest command from Step 2.

Expected: PASS for registry, required headings, token keys, and Style 7/8 boundaries.

- [ ] **Step 6: Commit protocol drafts**

```powershell
git add skills/article-visual-director/references/styles skills/article-visual-director/scripts/tests/test_skill_contract.py
git commit -m "feat: define eight article visual protocols"
```

### Task 3: Add Golden-Set Metadata and Contract Validation

**Files:**
- Create: `skills/article-visual-director/scripts/validate_style_contract.py`
- Create: `skills/article-visual-director/scripts/tests/test_validate_style_contract.py`
- Create: `skills/article-visual-director/assets/style-anchors/{profile_id}/golden-set.json` for all eight registry profile IDs

**Interfaces:**
- Consumes: Registry entries and per-profile protocol/token files.
- Produces: `validate_style_contract(skill_root: Path, phase: str, profile_id: str | None = None) -> list[dict[str, str]]` and a CLI with `--phase protocol|release` plus optional `--profile`.

- [ ] **Step 1: Write failing validator tests**

Create temporary fixtures and test these exact behaviors and error codes:

```python
def test_protocol_phase_accepts_candidate_golden_sets(self):
    self.assertEqual([], validate_style_contract(self.skill_root, "protocol"))

def test_release_phase_rejects_candidate_status(self):
    errors = validate_style_contract(self.skill_root, "release")
    self.assertEqual("golden_set_pending", errors[0]["code"])
    self.assertEqual("profiles[0].golden_set.status", errors[0]["path"])

def test_release_phase_rejects_missing_asset(self):
    self.approve_fixture_with_three_assets()
    (self.profile_root / "golden-cover.png").unlink()
    errors = validate_style_contract(self.skill_root, "release")
    self.assertTrue(any(error["code"] == "golden_asset_missing" for error in errors))

def test_release_phase_rejects_hash_drift(self):
    self.approve_fixture_with_three_assets()
    (self.profile_root / "golden-cover.png").write_bytes(b"changed")
    errors = validate_style_contract(self.skill_root, "release")
    self.assertTrue(any(error["code"] == "golden_asset_hash_mismatch" for error in errors))

def test_profile_filter_allows_one_approved_mode_to_release(self):
    self.approve_fixture_with_three_assets()
    self.assertEqual(
        [],
        validate_style_contract(self.skill_root, "release", "fixture-profile"),
    )

def test_protocol_identity_must_match_registry(self):
    tokens = json.loads(self.tokens_path.read_text(encoding="utf-8"))
    tokens["profile_id"] = "wrong-profile"
    self.tokens_path.write_text(json.dumps(tokens), encoding="utf-8")
    errors = validate_style_contract(self.skill_root, "protocol")
    self.assertTrue(any(error["code"] == "profile_identity_mismatch" for error in errors))
```

In `setUp`, create one registry entry named `fixture-profile`, a protocol containing every required heading, matching token JSON, and a candidate `golden-set.json`. `approve_fixture_with_three_assets()` writes cover/concept PNG bytes, diagram PNG/SVG bytes, two prompt files, computes hashes with `hashlib.sha256`, and replaces the candidate metadata with three approved asset entries.

- [ ] **Step 2: Run the new tests and verify the module is missing**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_style_contract.py -v
```

Expected: FAIL importing `validate_style_contract`.

- [ ] **Step 3: Implement the validator**

Implement `load_json`, `sha256_file`, `_add_error`, safe registry-relative path resolution, `validate_style_contract`, and `main`. The validator must:

- verify eight registry identities and unique paths;
- verify each protocol and token file exists;
- verify token `profile_id` and `protocol_version` match the registry;
- accept `candidate` golden sets in `protocol` phase;
- require `status=approved` and exactly the roles `cover`, `concept`, `diagram` in `release` phase;
- require artifact and prompt files to remain under the profile's golden directory;
- require diagram `editable_source_path` and imagegen reference-role metadata;
- recompute SHA-256 for every approved artifact, prompt, and editable source;
- validate only the selected registry entry when `--profile` is present.

The CLI prints the same JSON result shape as `validate_manifest.py` and exits non-zero on errors.

- [ ] **Step 4: Create eight candidate metadata files**

Each `golden-set.json` starts with:

```json
{
  "golden_set_version": 1,
  "profile_id": "handwritten-systems-explainer",
  "protocol_version": 2,
  "status": "candidate",
  "user_approval": {
    "status": "pending",
    "revision_notes": []
  },
  "assets": []
}
```

Use the matching profile ID in each directory. Empty assets are legal only in `protocol` phase.

- [ ] **Step 5: Run validator and all contract tests**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_style_contract.py -v
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
python skills/article-visual-director/scripts/validate_style_contract.py --phase protocol
```

Expected: All tests PASS and CLI returns `overall: passed` for protocol phase.

- [ ] **Step 6: Commit validator and candidate metadata**

```powershell
git add skills/article-visual-director/scripts/validate_style_contract.py skills/article-visual-director/scripts/tests/test_validate_style_contract.py skills/article-visual-director/assets/style-anchors
git commit -m "feat: validate article visual golden sets"
```

### Task 4: Add Backward-Compatible Manifest v2 Validation

**Files:**
- Modify: `skills/article-visual-director/scripts/validate_manifest.py`
- Modify: `skills/article-visual-director/scripts/tests/test_validate_manifest.py`
- Modify: `skills/article-visual-director/references/manifest-schema.md`

**Interfaces:**
- Consumes: Existing `validate_manifest(data, manifest_path, phase)` callers and Task 3 golden-set metadata.
- Produces: Backward-compatible `validate_manifest(data, manifest_path, phase, skill_root=None)`; v1 behavior remains unchanged while v2 adds protocol identity, theme separation, article anchor, and per-asset style validation. The CLI passes no override and uses the repository Skill root.

- [ ] **Step 1: Add v1 compatibility and v2 failure tests**

Keep the current approved v1 fixture and add:

```python
def test_v1_fixture_remains_valid(self):
    self.assertEqual([], validate_manifest(make_manifest(), self.manifest_path, "plan"))

def test_v2_imagegen_requires_approved_article_style_anchor(self):
    data = make_v2_manifest(renderer="imagegen")
    data["approvals"]["article_style_anchor"] = "not_required"
    self.assert_error(data, "article_style_anchor_required")

def test_v2_single_deterministic_asset_may_skip_anchor(self):
    data = make_v2_manifest(renderer="deterministic-diagram")
    data["approvals"]["article_style_anchor"] = "not_required"
    data["style"]["article_style_anchor_asset_id"] = None
    self.assertEqual([], validate_manifest(data, self.manifest_path, "plan"))

def test_v2_rejects_theme_override_outside_policy(self):
    data = make_v2_manifest()
    data["style"]["approved_overrides"] = ["palette.primary"]
    self.assert_error(data, "theme_override_not_allowed")

def test_v2_rejects_protocol_or_golden_hash_drift(self):
    data = make_v2_manifest()
    data["style"]["golden_set_sha256"] = "0" * 64
    self.assert_error(data, "golden_set_hash_mismatch")

def test_v2_integration_requires_passed_style_validation(self):
    data = make_v2_manifest(phase_ready=True)
    data["assets"][0]["style_validation"]["status"] = "pending"
    self.assert_error(data, "style_validation_not_passed", phase="integration")

def test_v2_rejects_forbidden_traits_and_theme_bleed(self):
    data = make_v2_manifest(phase_ready=True)
    validation = data["assets"][0]["style_validation"]
    validation["forbidden_traits_found"] = ["corporate-card-grid"]
    validation["theme_bleed"] = True
    errors = validate_manifest(data, self.manifest_path, "integration")
    self.assertTrue(any(error["code"] == "forbidden_style_trait" for error in errors))
    self.assertTrue(any(error["code"] == "style_theme_bleed" for error in errors))

def test_v2_anchor_asset_id_must_exist(self):
    data = make_v2_manifest()
    data["style"]["article_style_anchor_asset_id"] = "missing-asset"
    self.assert_error(data, "unknown_style_anchor_asset")
```

`make_v2_manifest()` writes a temporary approved protocol and golden-set file under a temporary Skill root, computes their real hashes, and returns a v2 manifest using that root through an optional `skill_root` argument added to `validate_manifest` for tests. The public CLI keeps the repository Skill root default.

Use error codes `article_style_anchor_required`, `theme_override_not_allowed`, `protocol_version_mismatch`, `golden_set_hash_mismatch`, `style_validation_not_passed`, `forbidden_style_trait`, `style_theme_bleed`, and `unknown_style_anchor_asset`.

- [ ] **Step 2: Run v2 tests and verify unsupported-version failures**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_manifest.py -v
```

Expected: Existing v1 tests pass; new v2 tests fail with `unsupported_manifest_version` or missing v2 logic.

- [ ] **Step 3: Split version-specific validation without changing the public API**

Add `VALID_MANIFEST_VERSIONS = {1, 2}`, retain `_validate_top_level_v1`, and add `_validate_top_level_v2`. Dispatch by `manifest_version` inside `_validate_top_level`. Do not reinterpret v1 `style_anchor` rules.

For v2 require `style` fields:

```json
{
  "profile_id": "handwritten-systems-explainer",
  "profile_version": 2,
  "protocol_path": "references/styles/08-handwritten-systems-explainer.md",
  "protocol_sha256": "<64 hex>",
  "golden_set_path": "assets/style-anchors/handwritten-systems-explainer/golden-set.json",
  "golden_set_sha256": "<64 hex>",
  "golden_reference_ids": ["hse-cover", "hse-concept", "hse-diagram"],
  "publication_theme": "green",
  "theme_override_policy": "title-layer-only",
  "approved_overrides": [],
  "article_reference_paths": [],
  "article_style_anchor_asset_id": "asset-cover"
}
```

Resolve protocol and golden-set paths under the Skill root, never under the article directory. Require the selected golden set to be approved and its profile/version to match. Recompute protocol and golden-set hashes.

- [ ] **Step 4: Implement v2 anchor requirement**

Require `approvals.article_style_anchor=approved` when any asset uses `imagegen`, `article_reference_paths` is non-empty, or the stored protocol/golden hashes differ from current files. Require the named anchor asset to exist. Permit `not_required` only when all assets are deterministic, there is exactly one asset, references are empty, and stored protocol/golden versions and hashes match.

- [ ] **Step 5: Implement v2 per-asset style validation**

Require each asset to contain:

```json
{
  "style_validation": {
    "status": "planned",
    "golden_reference_ids": ["hse-diagram"],
    "required_traits_passed": false,
    "forbidden_traits_found": [],
    "theme_bleed": false,
    "series_continuity": "planned",
    "review_notes": null
  }
}
```

During integration require `status=passed`, `required_traits_passed=true`, an empty `forbidden_traits_found`, `theme_bleed=false`, and `series_continuity=passed`.

- [ ] **Step 6: Document v1 and v2 as separate contracts**

Update `manifest-schema.md` so v1 remains a legacy accepted schema and v2 is the default. Include one complete legal v2 mixed-renderer example and the exact article-anchor decision table.

- [ ] **Step 7: Run manifest and integration regression tests**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_manifest.py -v
python skills/article-visual-director/scripts/tests/test_apply_visual_plan.py -v
```

Expected: All existing v1 and new v2 tests PASS.

- [ ] **Step 8: Commit Manifest v2**

```powershell
git add skills/article-visual-director/scripts/validate_manifest.py skills/article-visual-director/scripts/tests/test_validate_manifest.py skills/article-visual-director/references/manifest-schema.md
git commit -m "feat: validate article visual manifest v2"
```

### Task 5: Rewrite the Skill Workflow Around Protocols and Article Anchors

**Files:**
- Modify: `skills/article-visual-director/SKILL.md`
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: Registry, protocol files, golden-set lifecycle, and Manifest v2 rules.
- Produces: A shorter shared entrypoint that preserves the eight-item selection gate and loads only the selected profile.

- [ ] **Step 1: Add failing workflow contract tests**

Assert `SKILL.md` contains the state sequence `load selected protocol and approved golden set`, the three-way separation terms `publication_theme`, `visual_profile`, and `asset_semantics`, and the new anchor condition `any imagegen asset`. Assert the old text `when 3+ imagegen assets` is absent.

- [ ] **Step 2: Run the skill contract test and verify the old count gate fails**

```powershell
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
```

Expected: FAIL because the old count-based anchor text remains.

- [ ] **Step 3: Rewrite the shared state machine**

Use this exact order:

```text
inspect article
  -> present the existing eight bilingual modes
  -> wait for explicit style selection
  -> load selected protocol and approved golden set
  -> separate publication theme, visual profile, and asset semantics
  -> propose complete visual plan
  -> wait for plan approval
  -> evaluate article-style-anchor requirement
  -> generate and approve the anchor when required
  -> render remaining assets
  -> validate semantics, visual contract, and series continuity
  -> create a new illustrated Markdown copy
```

Keep the full eight-item menu verbatim. After selection, instruct the agent to read the registry and only the selected protocol/token files. If the golden set is `candidate` or missing, stop article production with `golden_set_pending` and enter the golden-production flow only after the user agrees.

- [ ] **Step 4: Add theme isolation and reference-use rules**

State that page themes default to title/page layers, cannot rewrite protocol invariants, and any approved override must be listed in the plan and v2 manifest. State that remaining imagegen assets use both approved golden references and the article anchor; deterministic assets use the matching token file and are visually checked against the anchor.

- [ ] **Step 5: Run contract and validator tests**

```powershell
python skills/article-visual-director/scripts/tests/test_skill_contract.py -v
python skills/article-visual-director/scripts/tests/test_validate_manifest.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit the workflow rewrite**

```powershell
git add skills/article-visual-director/SKILL.md skills/article-visual-director/scripts/tests/test_skill_contract.py
git commit -m "feat: gate article visuals on approved style protocols"
```

### Task 6: Build a Deterministic Golden-Diagram Renderer

**Files:**
- Create: `skills/article-visual-director/scripts/render_golden_diagram.py`
- Create: `skills/article-visual-director/scripts/tests/test_render_golden_diagram.py`

**Interfaces:**
- Consumes: A selected profile token JSON and the fixed comparison benchmark.
- Produces: An editable SVG plus a 1600×900 PNG with the exact labels `能力 10`, `AI ×100`, `输出 1000`, `能力 1`, `输出 100`, and `差距 900`.

- [ ] **Step 1: Write failing scene and SVG tests**

Test `build_scene(tokens) -> dict`, `render_svg(scene, output_path)`, and `render_png(scene, output_path, font_path)`. Assert all six exact labels appear in SVG, the output dimensions are 1600×900, and Style 8 uses the token colors `#171717`, `#F59E0B`, `#66AEE8`, and `#58B978`.

- [ ] **Step 2: Run tests and verify renderer import failure**

```powershell
python skills/article-visual-director/scripts/tests/test_render_golden_diagram.py -v
```

Expected: FAIL importing `render_golden_diagram`.

- [ ] **Step 3: Implement one semantic benchmark with token-driven rendering**

Use a shared two-lane comparison scene. Render geometry and text into SVG with XML escaping. Render the PNG with Pillow only when invoked; keep validator and integration scripts standard-library-only. Provide CLI arguments:

```text
--tokens PATH --svg PATH --png PATH --font PATH
```

Use the bundled primary runtime Python for PNG generation and `C:\Windows\Fonts\msyh.ttc` by default; Style 8 execution passes `C:\Windows\Fonts\simkai.ttf` when available.

- [ ] **Step 4: Run renderer tests with the bundled Python**

```powershell
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' skills/article-visual-director/scripts/tests/test_render_golden_diagram.py -v
```

Expected: PASS and no generated files remain inside the source tree after tests.

- [ ] **Step 5: Commit the renderer**

```powershell
git add skills/article-visual-director/scripts/render_golden_diagram.py skills/article-visual-director/scripts/tests/test_render_golden_diagram.py
git commit -m "feat: render deterministic style benchmark diagrams"
```

### Task 7: Produce and Approve Style 8 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-set.json`

**Interfaces:**
- Consumes: Style 8 protocol/tokens and the user-owned historical Style 8 references as generation-only visual references.
- Produces: The first three-image candidate set and, only after user confirmation, the first approved golden set.

- [ ] **Step 1: Freeze the two raster benchmark prompts**

Cover objective: a wide text-free editorial image showing two capability baselines entering the same AI ×100 amplifier and leaving with visibly unequal output scale. Use warm `#F4F1E6` paper, bold imperfect `#171717` ink, saturated orange/blue/green fills, black label-tab shapes, flat orthographic composition, no pastel cards, no corporate flowchart, no 3D prism, no page-theme green takeover.

Concept objective: a body illustration showing that AI amplifies the quality of the starting structure rather than making all users equal. Use one compact hand-drawn operational idea, direct arrows, rough ink pressure, saturated semantic fills, dot-paper texture, generous margins, and no readable model-generated text.

- [ ] **Step 2: Generate the two raster candidates with imagegen**

Load the image-generation skill. Attach the historical good Style 8 images only as visual references, state which traits to preserve, and generate `golden-cover.png` and `golden-concept.png` from the frozen prompts.

- [ ] **Step 3: Render the deterministic comparison candidate**

```powershell
& 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' skills/article-visual-director/scripts/render_golden_diagram.py --tokens skills/article-visual-director/references/styles/08-handwritten-systems-explainer.tokens.json --svg skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-diagram.svg --png skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer/golden-diagram.png --font C:\Windows\Fonts\simkai.ttf
```

Expected: both outputs exist at 1600×900 and contain exact comparison labels.

- [ ] **Step 4: Present all three images together and stop for user review**

Do not set `status=approved`. Show cover, concept, and diagram as one set. Record requested changes in `user_approval.revision_notes` and regenerate only failed members.

- [ ] **Step 5: Promote only after explicit approval**

After the user approves the complete set, write three asset entries with IDs `hse-cover`, `hse-concept`, and `hse-diagram`; record roles, prompt paths, artifact paths, dimensions, editable diagram source, reference roles, and SHA-256 values. Set both `status` and `user_approval.status` to `approved`.

- [ ] **Step 6: Validate and commit Style 8**

```powershell
python skills/article-visual-director/scripts/validate_style_contract.py --phase release --profile handwritten-systems-explainer
git add skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer
git commit -m "feat: approve handwritten systems golden set"
```

Expected: release validation PASS before commit.

### Task 8: Produce and Approve Style 7 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/soft-technical-sketch/golden-set.json`

**Interfaces:** Produces approved IDs `sts-cover`, `sts-concept`, and `sts-diagram`.

- [ ] Generate a wide cover and body concept for the same capability-amplification thesis using fine soft pencil/ink, low-saturation watercolor, warm light paper, an approachable teaching metaphor, open captions, and no bold black frames, black tabs, high-saturation blocks, corporate cards, or childish doodles.
- [ ] Render the exact comparison benchmark with `07-soft-technical-sketch.tokens.json` and `msyh.ttc`.
- [ ] Present the three-image set and stop until the user explicitly approves it; revise only failed members.
- [ ] Record prompts, sources, hashes, dimensions, approval notes, and the three exact IDs in `golden-set.json`.
- [ ] Run `validate_style_contract.py --phase release --profile soft-technical-sketch` and commit with `feat: approve soft technical sketch golden set`.

### Task 9: Produce and Approve Style 1 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/technical-editorial-minimal/golden-set.json`

**Interfaces:** Produces approved IDs `tem-cover`, `tem-concept`, and `tem-diagram`.

- [ ] Generate cover/concept candidates using crisp flat geometry, strict editorial grid, off-white ground, ink blue, one blue accent plus one restrained warm highlight, modern sans typography zones, and no hand-drawn marks, dashboard chrome, or 3D.
- [ ] Render the comparison benchmark with `01-technical-editorial-minimal.tokens.json`.
- [ ] Present, wait for explicit user approval, revise failed members only, and persist complete metadata/hashes.
- [ ] Validate the selected profile in release phase and commit with `feat: approve technical editorial golden set`.

### Task 10: Produce and Approve Style 2 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/white-green-editorial-minimal/golden-set.json`

**Interfaces:** Produces approved IDs `wgem-cover`, `wgem-concept`, and `wgem-diagram`.

- [ ] Generate cover/concept candidates using white/pale mint, emerald/forest-green hierarchy, active 70–90% wide occupancy, matte flat geometry, one semantic nucleus, and no sustainability leaves, pale card pile, glassmorphism, or empty outer bands.
- [ ] Render the comparison benchmark with `02-white-green-editorial-minimal.tokens.json`.
- [ ] Present, wait for explicit user approval, revise failed members only, and persist complete metadata/hashes.
- [ ] Validate release and commit with `feat: approve white green editorial golden set`.

### Task 11: Produce and Approve Style 3 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/neon-systems/golden-set.json`

**Interfaces:** Produces approved IDs `ns-cover`, `ns-concept`, and `ns-diagram`.

- [ ] Generate cover/concept candidates using navy foundation, controlled cyan/acid-green signal paths, precise dark modular geometry, one focal route, and no cyberpunk city, HUD text, magenta rainbow, or uncontrolled glow.
- [ ] Render the comparison benchmark with `03-neon-systems.tokens.json`.
- [ ] Present, wait for explicit user approval, revise failed members only, and persist complete metadata/hashes.
- [ ] Validate release and commit with `feat: approve neon systems golden set`.

### Task 12: Produce and Approve Style 4 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/blueprint-linework/golden-set.json`

**Interfaces:** Produces approved IDs `bl-cover`, `bl-concept`, and `bl-diagram`.

- [ ] Generate cover/concept candidates using disciplined orthographic construction, blueprint or warm drafting ground, uniform thin lines, sparse cyan highlights, cutaway/boundary language, and no fake dimensions, photorealism, or isometric view.
- [ ] Render the comparison benchmark with `04-blueprint-linework.tokens.json`.
- [ ] Present, wait for explicit user approval, revise failed members only, and persist complete metadata/hashes.
- [ ] Validate release and commit with `feat: approve blueprint linework golden set`.

### Task 13: Produce and Approve Style 5 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/isometric-infrastructure/golden-set.json`

**Interfaces:** Produces approved IDs `ii-cover`, `ii-concept`, and `ii-diagram`.

- [ ] Generate cover/concept candidates using a fixed 30-degree isometric camera, matte modules, consistent scale, restrained blue/amber system, one visible spatial path, and no random perspective, server clutter, logos, or unsupported connections.
- [ ] Render the comparison benchmark with `05-isometric-infrastructure.tokens.json`.
- [ ] Present, wait for explicit user approval, revise failed members only, and persist complete metadata/hashes.
- [ ] Validate release and commit with `feat: approve isometric infrastructure golden set`.

### Task 14: Produce and Approve Style 6 Golden Set

**Files:**
- Create: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-cover.png`
- Create: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-concept.png`
- Create: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-diagram.png`
- Create: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-diagram.svg`
- Create: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-cover.prompt.md`
- Create: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-concept.prompt.md`
- Modify: `skills/article-visual-director/assets/style-anchors/cinematic-conceptual/golden-set.json`

**Interfaces:** Produces approved IDs `cc-cover`, `cc-concept`, and `cc-diagram`.

- [ ] Generate cover/concept candidates around one memorable amplification metaphor, using controlled dramatic light, atmospheric depth, a strong silhouette, limited palette, and no multi-module infographic, generic face, spectacle without thesis, or embedded title text.
- [ ] Render the comparison benchmark with `06-cinematic-conceptual.tokens.json`; keep it an editorial companion with the same palette and hierarchy, not a cinematic scene pretending to be a diagram.
- [ ] Present, wait for explicit user approval, revise failed members only, and persist complete metadata/hashes.
- [ ] Validate release and commit with `feat: approve cinematic conceptual golden set`.

### Task 15: Add a Mixed-Renderer Manifest v2 Regression Fixture

**Files:**
- Create: `skills/article-visual-director/scripts/tests/fixtures/manifest-v2-mixed/`
- Modify: `skills/article-visual-director/scripts/tests/test_validate_manifest.py`
- Modify: `skills/article-visual-director/scripts/tests/test_apply_visual_plan.py`

**Interfaces:**
- Consumes: An approved golden profile, Manifest v2, one imagegen cover, and one deterministic diagram.
- Produces: An end-to-end fixture proving article-anchor approval, style validation, integration, and idempotency.

- [ ] **Step 1: Add a failing end-to-end v2 test**

Create a fixture article and manifest that select Style 8, use `publication_theme=green` with `title-layer-only`, designate the cover as article anchor, and include a deterministic comparison asset. Test that integration is rejected until both assets have passed `style_validation` and the anchor approval is `approved`.

- [ ] **Step 2: Complete fixture assets and approved state**

Use tiny local placeholder artifact bytes for unit tests; reference the real protocol and golden-set hashes. Keep image generation out of tests.

- [ ] **Step 3: Validate and apply twice**

```powershell
python skills/article-visual-director/scripts/tests/test_validate_manifest.py -v
python skills/article-visual-director/scripts/tests/test_apply_visual_plan.py -v
```

Expected: first application creates the illustrated copy; second application is unchanged; source bytes remain identical.

- [ ] **Step 4: Commit the regression fixture**

```powershell
git add skills/article-visual-director/scripts/tests
git commit -m "test: cover mixed renderer style protocol workflow"
```

### Task 16: Run Final Skill Verification and Update the Design Status

**Files:**
- Modify: `docs/superpowers/specs/2026-08-28-article-visual-director-style-protocols-design.md`

**Interfaces:**
- Consumes: All implementation tasks and eight approved golden sets.
- Produces: Verified Skill state and a design document marked implemented.

- [ ] **Step 1: Run the complete test suite**

```powershell
python -m unittest discover -s skills/article-visual-director/scripts/tests -p 'test_*.py' -v
```

Expected: all tests PASS.

- [ ] **Step 2: Validate protocols and all approved golden sets**

```powershell
python skills/article-visual-director/scripts/validate_style_contract.py --phase release
```

Expected: `overall: passed` with an empty error list.

- [ ] **Step 3: Run repository hygiene checks**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only intentionally modified files are present. Existing untracked `__pycache__` directories remain uncommitted.

- [ ] **Step 4: Mark the design implemented and commit**

Change the design status line to `状态：已实施并通过验证`, add the final test command and result summary, then commit:

```powershell
git add -f docs/superpowers/specs/2026-08-28-article-visual-director-style-protocols-design.md
git commit -m "docs: record stable visual protocol rollout"
```

- [ ] **Step 5: Hand off**

Report the Skill path, registry, eight protocols, golden-set directories, Manifest v2 schema, validator commands, test totals, and confirmation that the original eight menu entries and legacy v1 workflow remain available.
