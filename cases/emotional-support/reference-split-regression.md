# Regression: Emotional Support Reference Split

## Summary

`emotional-support` was refactored from one large `SKILL.md` into a smaller main skill plus reference modules.

This regression check verifies that the refactor preserved discovery and reference structure.

## Change Under Test

Before:

```text
skills/emotional-support/SKILL.md
```

The main file contained all behavior rules and was much larger than peer skills.

After:

```text
skills/emotional-support/
  SKILL.md
  references/
    default-response.md
    deep-analysis-mode.md
    mode-boundaries.md
    reflection-frames.md
    safety-boundary.md
```

## Checks Performed

### Skills CLI Discovery

Command:

```bash
npx skills add . --list
```

Result:

```text
Found 5 skills:
- content-creator
- emotional-support
- skill-evaluator
- technical-deep-dive
- thinking-router
```

Status: pass.

### Reference Link Check

The main `SKILL.md` references:

```text
references/deep-analysis-mode.md
references/default-response.md
references/mode-boundaries.md
references/reflection-frames.md
references/safety-boundary.md
```

All referenced files exist.

Status: pass.

### Size Check

After the refactor:

| File | Lines | Words |
|---|---:|---:|
| `skills/emotional-support/SKILL.md` | 166 | 929 |
| `references/deep-analysis-mode.md` | 138 | 687 |
| `references/default-response.md` | 107 | 446 |
| `references/mode-boundaries.md` | 81 | 537 |
| `references/reflection-frames.md` | 82 | 283 |
| `references/safety-boundary.md` | 31 | 181 |

Status: pass.

## What This Does Not Prove

This is a structural regression check.

It does not prove:

- A live agent will always load the correct reference file.
- Deep Analysis Mode output quality is unchanged.
- Safety behavior is unchanged in real conversations.
- Platform-specific clients handle references the same way.

Those require model-output regression tests or real client testing.

## Follow-Up

Next recommended checks:

1. Run manual output checks for the most important cases in `evals/emotional-support-cases.md`.
2. Verify a fresh Codex session can use the refactored `emotional-support` skill and load references when needed.
3. If reference loading is unreliable, move the most critical boundary rules back into the main `SKILL.md`.

