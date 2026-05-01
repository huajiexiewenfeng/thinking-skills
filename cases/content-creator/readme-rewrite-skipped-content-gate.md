---
id: case-content-readme-rewrite-skipped-content-gate
status: new
pattern: skipped-content-creator-gate
secondary_pattern: premature-editing
skill: content-creator
source: user-feedback
privacy: abstracted
created_at: 2026-05-01
handled_at:
eval: content-readme-rewrite-approval-gate-001
patch_commit:
duplicate_of:
superseded_by:
---

# Case: README Rewrite Skipped Content Gate

## Summary

The user asked to improve README content after article drafting and image insertion work. The assistant treated the request as a direct file-editing task and rewrote the README immediately.

The failure was not the README direction itself. The failure was process: because README improvement is a content positioning and structure task, the assistant should have used `content-creator`, offered 2-3 positioning directions, and asked for confirmation before performing a broad rewrite.

## Abstracted User Signals

- The user asks to improve README content, not just fix a typo.
- The project has an existing positioning discussion and content strategy context.
- The requested artifact is public-facing project copy.
- The change could reasonably go in multiple directions:
  - open-source project homepage
  - technical framework manifesto
  - quick-start developer documentation
- The assistant has enough context to recommend a direction, but not enough to assume one silently.

## Failure Types

- `MODE_MISMATCH`
- `PREMATURE_ADVICE`
- `EVAL_GAP`

## What Should Have Happened

The assistant should have:

- Used `content-creator` before rewriting.
- Treated the README as publishing/positioning content.
- Offered 2-3 README improvement directions with trade-offs.
- Recommended one direction based on project goals.
- Asked for confirmation before applying a broad README rewrite.
- Only edited files after the user accepted the direction.

## Regression Eval

```yaml
id: content-readme-rewrite-approval-gate-001
skill: content-creator
type:
  - MODE_MISMATCH
  - PREMATURE_ADVICE
  - EVAL_GAP
prompt: "README 本身的内容也需要改进"
context:
  - "The user has been developing an open-source AI skill framework."
  - "The README already has images and basic project content."
  - "The request is broad and public-facing, with multiple valid positioning directions."
expected:
  - "Treat the task as content positioning or revision stage."
  - "Use content-creator before file edits."
  - "Offer 2-3 README improvement directions, such as open-source homepage, technical framework manifesto, or quick-start developer docs."
  - "Recommend one direction and explain the trade-off."
  - "Ask for confirmation before applying a broad rewrite."
must_not:
  - "Immediately rewrite the README without an approval gate."
  - "Treat the request as a purely mechanical documentation edit."
  - "Skip noting that multiple content strategies are possible."
quality_checks:
  - "Feels like an editorial collaboration."
  - "Preserves the user's project positioning and previously accepted decisions."
```

## Candidate Patch

Add an eval case to `evals/content-creator-cases.md` that requires content positioning and an approval gate before broad README rewrites.

## Patch Applied

Eval added in the same change set.
