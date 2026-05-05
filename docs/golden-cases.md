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

# Golden Case: Multi-Skill Collaboration Improvement Loop

## Skill

`thinking-router`, `technical-deep-dive`, `content-creator`, `conversation-review`

## Why This Is Golden

This case preserves a reusable collaboration pattern where one complex user goal required multiple domain skills to work on the same artifact, not produce separate answers. Technical analysis grounded the facts, content creation shaped the public article format, conversation review identified a reusable failure signal, and the improvement was written back into the relevant skill rule and pushed to version control.

## Applies When

- The user is working on a real artifact that crosses technical analysis, writing, platform fit, and workflow improvement.
- The task involves private or sensitive implementation context that must be abstracted before publication.
- The user asks for self-review, preservation, or rule updates after a successful collaboration pattern appears.
- A small observed failure can be converted into a durable skill rule without overfitting.

## Does Not Apply When

- The user only needs a direct answer, a single edit, or ordinary content polishing.
- The conversation lacks a concrete artifact or verifiable workflow outcome.
- The pattern depends on raw private conversation details that cannot be abstracted.
- A lightweight eval would fully capture the behavior better than a narrative golden case.

## Reusable Pattern

- Choose one primary skill based on the highest-risk dimension, then add secondary skills only for distinct constraints.
- Keep skills coordinated around one shared artifact rather than letting each skill produce an independent response.
- Separate facts, inferences, publication-safe abstractions, and user-provided sensitive details.
- Use self-review to identify a reusable success or failure signal after the work proves useful.
- Convert a stable process observation into the smallest useful skill rule, then verify and commit the change.

## Must Preserve

- Multi-skill orchestration should be conditional and artifact-centered, not automatic skill stacking.
- Technical facts should remain grounded in source, code, or user-confirmed business context.
- Content guidance should respect platform reading shape while preserving the user's primary purpose.
- Private project names, internal class names, topics, credentials, paths, and raw conversation details should be abstracted in public-facing artifacts.
- Improvement-loop actions should produce a concrete repository change only when the user asks to record or preserve the behavior.

## Regression Risk

Future routing changes could make the assistant choose only one skill for cross-domain work, or overcorrect by invoking too many skills without a shared output. Content-generation rules could also regress into platform-unfriendly formatting or leak implementation-specific details if technical analysis is not paired with publication-safety review.

## Convert To

- [x] Eval
- [x] Skill rule
- [x] Keep as golden case
- [ ] Discard later

## Eval Form

Input:
A user asks for help improving a technical article series using real project context, then notices a reusable platform-formatting issue and asks whether the behavior should be preserved.

Expected:
Route through technical analysis for correctness, content creation for platform shape, and conversation review for reusable behavior. Abstract private implementation details, patch the smallest relevant skill rule when asked, verify the diff, and keep unrelated worktree changes untouched.

Must not:
Treat the task as ordinary article polishing, expose raw project-specific details in public-facing prose, invoke skills as disconnected answer blocks, or record praise instead of reusable behavior.
