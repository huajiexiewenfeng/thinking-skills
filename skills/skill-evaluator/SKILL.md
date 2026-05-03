---
name: skill-evaluator
description: Use when reviewing a Thinking Skills failure, golden case candidate, user feedback about a skill response, eval result, routing mistake, unsafe behavior, overly long output, too many questions, jargon exposure, regression risk, or when deciding how to improve or preserve a skill.
---

# Skill Evaluator

## Purpose

`skill-evaluator` reviews failures and golden case candidates in Thinking Skills, then recommends the smallest useful improvement or preservation action.

It does not rewrite skills by default. It diagnoses the case, proposes eval coverage, checks for overfitting or conflicts, and suggests a minimal patch or preservation plan.

## When to Use

Use this skill when:

- A user says a skill response felt wrong.
- A router chose the wrong skill.
- A domain skill used the wrong mode.
- A response was too long, too clinical, too technical, too shallow, or too solution-oriented.
- A response asked too many questions.
- A response exposed too much method-base jargon.
- A safety boundary was missed or over-triggered.
- A user says a response worked especially well and asks whether it should be preserved.
- A golden case may conflict with a failure case or existing rule.
- A skill seems to have lost a previously good behavior.
- You need to decide whether to patch, add evals, or refactor.

## Method Bases

```yaml
method_bases:
  core:
    - Failure taxonomy
    - Golden case preservation
    - Regression-case thinking
    - Minimal patch discipline
    - Router versus domain responsibility split
  supporting:
    - Skill authoring checklist
    - Evaluation schema
    - Changelog discipline
  safety:
    - Do not preserve private raw conversations
    - Abstract sensitive examples before storing them
    - Do not preserve full articles, drafts, or sensitive material as golden cases
    - Prioritize safety boundary failures
```

## Inputs to Inspect

When available, inspect:

- User feedback.
- The bad response or summarized failure.
- The relevant `SKILL.md`.
- Router rules if routing may be involved.
- Existing eval cases.
- Related docs: `docs/failure-taxonomy.md`, `docs/eval-schema.md`, `docs/improvement-loop.md`, `docs/golden-cases.md`.

If the raw conversation is sensitive, work from an abstract summary.

## Evaluation Process

1. Restate the case in one short paragraph.
2. Decide whether this is a failure, golden candidate, mixed case, or ordinary feedback.
3. For failures, classify the failure using `docs/failure-taxonomy.md`.
4. For golden candidates, identify the reusable behavior and whether it is worth preserving.
5. Check for conflicts with existing failure cases, golden cases, evals, or skill rules.
6. Decide where the change belongs:
   - Router
   - Domain skill
   - Method base
   - Eval gap
   - Golden case
   - Platform adapter
   - Documentation
7. Check whether an existing eval or golden case would catch or preserve it.
8. Propose one new eval, eval update, golden case, or skill rule update.
9. Propose the smallest useful patch or preservation action.
10. Identify risks of overfitting.
11. Recommend whether to patch now, preserve as golden case, collect more examples, refactor, or discard.

## Failure Evaluation Process

Use this shorter path when the case is clearly a failure:

1. Restate the failure in one short paragraph.
2. Classify the failure using `docs/failure-taxonomy.md`.
3. Decide where the failure belongs:
   - Router
   - Domain skill
   - Method base
   - Eval gap
   - Platform adapter
   - Documentation
4. Check whether an existing eval would catch it.
5. Propose one new eval or eval update.
6. Propose the smallest useful patch.
7. Identify risks of overfitting.
8. Recommend whether to patch now, collect more examples, or refactor.

## Golden Evaluation Process

Use this shorter path when the case is clearly a golden candidate:

1. Restate the reusable behavior in one short paragraph.
2. Confirm it is not just praise or one-off satisfaction.
3. Define `Applies When` and `Does Not Apply When`.
4. Check whether it conflicts with existing failure cases or rules.
5. Recommend one outcome:
   - Convert to eval.
   - Patch skill rule.
   - Keep as golden case.
   - Discard as ordinary success.
6. Identify the regression risk.

## Output Format

Use this concise structure:

```markdown
## Diagnosis

Failure summary:

Failure types:

Likely source:

## Eval Gap

Existing eval coverage:

New or updated eval:

## Patch Plan

Smallest useful change:

Files likely affected:

Risks:

Recommendation:
```

For golden candidates, use:

```markdown
## Golden Diagnosis

Reusable behavior:

Applies when:

Does not apply when:

## Conflict Check

Potential conflicts:

Resolution:

## Preservation Plan

Recommended outcome:

Files likely affected:

Regression risk:
```

## Patch Discipline

Prefer:

- Add or adjust one eval.
- Add or refine one golden case only when the behavior is reusable.
- Clarify one mode boundary.
- Add one trigger or anti-trigger.
- Shorten or simplify one output rule.
- Move bulky repeated material into a reference file.

Avoid:

- Rewriting a whole skill for one failure.
- Adding large new theory sections.
- Treating user preference as universal without checking scope.
- Recording praise as a golden case.
- Preserving raw conversations, full articles, or private drafts.
- Making the skill more rigid than the domain requires.

## Common Mistakes

- Jumping straight to editing without diagnosing.
- Blaming the model when the skill gave unclear instructions.
- Adding rules but no eval case.
- Fixing the domain skill when the router was wrong.
- Fixing the router when the domain skill mode was wrong.
- Preserving raw sensitive conversations in cases.
- Overfitting to one user's phrasing.
- Letting golden cases and failure cases conflict without adding applicability conditions.
