---
name: skill-evaluator
description: Use when reviewing a Thinking Skills failure, user feedback about a bad skill response, eval result, routing mistake, unsafe behavior, overly long output, too many questions, jargon exposure, or when deciding how to improve a skill.
---

# Skill Evaluator

## Purpose

`skill-evaluator` reviews failures in Thinking Skills and recommends the smallest useful improvement.

It does not rewrite skills by default. It diagnoses the failure, proposes eval coverage, and suggests a minimal patch plan.

## When to Use

Use this skill when:

- A user says a skill response felt wrong.
- A router chose the wrong skill.
- A domain skill used the wrong mode.
- A response was too long, too clinical, too technical, too shallow, or too solution-oriented.
- A response asked too many questions.
- A response exposed too much method-base jargon.
- A safety boundary was missed or over-triggered.
- You need to decide whether to patch, add evals, or refactor.

## Method Bases

```yaml
method_bases:
  core:
    - Failure taxonomy
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
    - Prioritize safety boundary failures
```

## Inputs to Inspect

When available, inspect:

- User feedback.
- The bad response or summarized failure.
- The relevant `SKILL.md`.
- Router rules if routing may be involved.
- Existing eval cases.
- Related docs: `docs/failure-taxonomy.md`, `docs/eval-schema.md`, `docs/improvement-loop.md`.

If the raw conversation is sensitive, work from an abstract summary.

## Evaluation Process

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

## Patch Discipline

Prefer:

- Add or adjust one eval.
- Clarify one mode boundary.
- Add one trigger or anti-trigger.
- Shorten or simplify one output rule.
- Move bulky repeated material into a reference file.

Avoid:

- Rewriting a whole skill for one failure.
- Adding large new theory sections.
- Treating user preference as universal without checking scope.
- Making the skill more rigid than the domain requires.

## Common Mistakes

- Jumping straight to editing without diagnosing.
- Blaming the model when the skill gave unclear instructions.
- Adding rules but no eval case.
- Fixing the domain skill when the router was wrong.
- Fixing the router when the domain skill mode was wrong.
- Preserving raw sensitive conversations in cases.
- Overfitting to one user's phrasing.

