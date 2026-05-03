# Golden Cases

## Purpose

Golden cases preserve reusable behavior that should not be lost.

They are the positive side of the improvement loop:

```text
failure case -> do not repeat this bad pattern
golden case  -> preserve this good pattern
```

A golden case is not a praise archive. It records the behavior pattern that made a response useful.

## What Counts

Create a golden case only when at least one condition is true:

- A skill proves it can independently handle a core scenario.
- A reusable collaboration pattern appears.
- A subtle style or judgment pattern is likely to be broken by future changes.
- The user explicitly says this mode should be preserved.

Ordinary satisfaction is not enough.

## What Not to Record

Do not record:

- Praise without reusable behavior.
- Raw private conversations.
- Full articles, drafts, or sensitive personal material.
- One-off taste unless it appears repeatedly.
- A golden case when a short eval would capture the behavior.

Use this rule:

```text
Do not record praise. Record reusable behavior.
```

## Required Fields

Every golden case should include:

```markdown
# Golden Case: [Short Name]

## Skill

`content-creator`

## Why This Is Golden

Describe the reusable behavior, not the praise.

## Applies When

Name the conditions where this pattern should apply.

## Does Not Apply When

Name the conditions where this pattern should not apply.

## Reusable Pattern

- ...
- ...
- ...

## Must Preserve

- ...
- ...

## Regression Risk

What future change might break this good behavior?

## Convert To

- [ ] Eval
- [ ] Skill rule
- [ ] Keep as golden case
- [ ] Discard later

## Eval Form

Input:
Expected:
Must not:
```

## Lifecycle

```text
User says a response worked especially well
  -> conversation-review decides whether this is reusable behavior
  -> create a golden candidate only if it is reusable
  -> skill-evaluator checks for conflicts and overfitting
  -> convert to eval, skill rule, retained golden case, or discard
```

Golden cases should be digested over time. They should not accumulate forever.

## Conflict Handling

Golden cases and failure cases can appear to conflict.

Treat them as complementary constraints:

```text
failure case = lower bound
golden case  = preferred direction
```

When they conflict, check:

- Are the applicable conditions different?
- Is one case overgeneralized?
- Should both become a conditional rule?
- Should one become an eval and the other remain a narrative case?

`skill-evaluator` should recommend the smallest resolution:

- Add `Applies When` / `Does Not Apply When`.
- Merge cases.
- Convert one case to an eval.
- Patch a skill rule.
- Retire a stale case.

## Size Limit

Each first-party skill should keep at most 3-5 golden cases.

When a skill exceeds that limit, merge, convert, or discard. Do not create a large success archive.

## First-Wave Policy

Do not create real golden cases until the pattern is clearly reusable.

For now, use this document to guide Dolores reviews and evaluator recommendations.
