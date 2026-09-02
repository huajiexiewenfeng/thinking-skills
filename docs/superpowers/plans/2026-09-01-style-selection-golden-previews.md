# Style Selection Golden Previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show one verified approved golden cover beneath each of the nine Style choices before the user selects a visual profile.

**Architecture:** Add a deterministic read-only helper that resolves and validates registered cover previews, then make the mandatory Style selection contract consume that helper's JSON output. Keep image rendering in the Skill response layer and keep the helper limited to registry/golden metadata and strict artifact hashing.

**Tech Stack:** Python 3, JSON, `pathlib`, existing `portable_hash.py`, Markdown local-image previews, `unittest`.

## Global Constraints

- The complete bilingual nine-Style menu remains mandatory.
- Exactly one approved golden cover is attempted per Style.
- Pre-selection loading is limited to the registry and each profile's golden-set cover metadata.
- Only `status=approved`, `user_approval.status=approved`, one `role=cover`, existing file, and matching binary SHA-256 may render.
- An unavailable preview displays `黄金图暂不可用`; no substitute or generation is allowed.
- Codex previews use an absolute local path rooted at the loaded Skill.
- The workflow still stops for explicit Style selection after the menu.

---

### Task 1: Add failing preview resolver tests

**Files:**
- Create: `skills/article-visual-director/scripts/tests/test_list_style_previews.py`
- Create later: `skills/article-visual-director/scripts/list_style_previews.py`

**Interfaces:**
- Consumes: `collect_style_previews(skill_root: Path) -> list[dict[str, object]]`.
- Produces: tests for nine available real previews and deterministic unavailable results.

- [ ] **Step 1: Write the failing tests**

Create tests that import `list_style_previews.py`, call `collect_style_previews(SKILL_ROOT)`, and assert:

```python
self.assertEqual(list(range(1, 10)), [item["ordinal"] for item in previews])
self.assertTrue(all(item["status"] == "available" for item in previews))
self.assertTrue(all(Path(item["absolute_path"]).is_absolute() for item in previews))
```

Create a temporary one-profile fixture whose golden set is approved but whose cover artifact is missing, then assert:

```python
self.assertEqual("unavailable", previews[0]["status"])
self.assertEqual("artifact_missing", previews[0]["reason"])
self.assertNotIn("absolute_path", previews[0])
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```powershell
python skills/article-visual-director/scripts/tests/test_list_style_previews.py -v
```

Expected: import or file-not-found error because `list_style_previews.py` does not exist.

### Task 2: Implement the deterministic resolver

**Files:**
- Create: `skills/article-visual-director/scripts/list_style_previews.py`
- Test: `skills/article-visual-director/scripts/tests/test_list_style_previews.py`

**Interfaces:**
- Consumes: Skill root containing `references/style-registry.json` and registered `golden_set_path` values.
- Produces: ordered JSON records with `ordinal`, `profile_id`, `name_en`, `name_zh`, `status`, and either `absolute_path` or `reason`.

- [ ] **Step 1: Implement result collection**

Implement `collect_style_previews` with these reason codes: `golden_set_unavailable`, `cover_role_invalid`, `artifact_path_invalid`, `artifact_missing`, and `artifact_hash_mismatch`. Resolve the artifact beneath the golden-set directory and call:

```python
sha256_matches_file(artifact_path, cover["artifact_sha256"])
```

Do not normalize line endings for the PNG.

- [ ] **Step 2: Implement JSON CLI output**

Add `--skill-root` with a default of the script's parent Skill directory and print:

```python
json.dumps(collect_style_previews(skill_root), ensure_ascii=False, indent=2)
```

- [ ] **Step 3: Run focused tests to verify GREEN**

Run the Task 1 command. Expected: all preview resolver tests pass.

### Task 3: Add the menu presentation contract with TDD

**Files:**
- Modify: `skills/article-visual-director/scripts/tests/test_skill_contract.py`
- Modify: `skills/article-visual-director/SKILL.md`

**Interfaces:**
- Consumes: resolver JSON from Task 2.
- Produces: a nine-card menu contract and explicit unavailable fallback.

- [ ] **Step 1: Write the failing contract test**

Add `test_style_selection_gate_renders_verified_golden_cover_for_each_option` and assert the Skill mentions:

```python
self.assertIn("scripts/list_style_previews.py", skill_text)
self.assertIn("one verified golden cover immediately after each Style", skill_text)
self.assertIn("黄金图暂不可用", skill_text)
self.assertIn("absolute local filesystem path", skill_text)
self.assertIn("Do not substitute", skill_text)
self.assertIn("registry and golden cover metadata only", skill_text)
```

- [ ] **Step 2: Run the contract test to verify RED**

Run the focused unittest target. Expected: FAIL because the current menu has text only.

- [ ] **Step 3: Implement the response recipe**

Before the existing nine-item list, require the resolver command. Define each item as bilingual text followed by:

```text
![N. English Name 黄金图](<absolute local filesystem path>)
```

When `status=unavailable`, render `黄金图暂不可用`. State that this preview exception loads registry and golden cover metadata only, and does not load other profiles' protocols or contracts.

- [ ] **Step 4: Preserve the stop gate**

Keep the existing instruction to stop after all nine items plus recommendation and wait for an explicit selection.

- [ ] **Step 5: Run focused contract test to verify GREEN**

Run the Task 3 focused command. Expected: PASS.

### Task 4: Verify, commit, and prepare the authorized push

**Files:**
- Verify all files from Tasks 1-3 and the saved implementation plan.

**Interfaces:**
- Consumes: green focused tests.
- Produces: one verified commit on `codex/narrow-style9-image-runtime-fix`.

- [ ] **Step 1: Run complete verification**

Run the full article-visual-director unittest suite, Style 8 release validation, source and installed `quick_validate`, benchmark case list/prompts, `git diff --check`, and a staged-index snapshot verification.

- [ ] **Step 2: Commit only intended files**

Exclude `golden-diagram.prompt.md` line-ending state and Python cache directories. Commit with:

```powershell
git commit -m "feat(article-visual-director): preview goldens in style menu"
```

- [ ] **Step 3: Push only after explicit repository authorization**

Push the accumulated commits to `https://github.com/huajiexiewenfeng/thinking-skills.git`, branch `codex/narrow-style9-image-runtime-fix`, only after the user explicitly authorizes that exact repository, branch, and commit payload.
