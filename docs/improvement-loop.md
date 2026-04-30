# Improvement Loop

## Purpose

Thinking Skills should improve through real failures, not only through intuition.

The improvement loop turns user feedback and failed conversations into reusable eval cases, diagnosis, minimal patches, and changelog entries.

This project currently targets a semi-automatic loop: humans provide judgment and real examples; AI helps classify failures, draft evals, and propose small skill changes.

## Loop

```text
Failure signal
  -> abstract failure case
  -> classify failure
  -> add or update eval
  -> evaluate current skill
  -> propose minimal patch
  -> apply patch
  -> update changelog
  -> retest
```

## What Counts as a Failure Signal?

- User says the response felt wrong, too long, too clinical, too shallow, too technical, or too solution-oriented.
- The router chooses the wrong skill.
- A domain skill exposes too much framework jargon.
- The response asks too many questions.
- The response misses safety boundaries.
- The response solves a different problem from the one the user wanted.
- The response works once but is not general enough.

## Roles

| Role | Responsibility |
|---|---|
| Human reviewer | Provides feedback, decides whether the behavior is acceptable |
| `skill-evaluator` | Classifies failure type and recommends a minimal patch |
| Domain skill | Receives the smallest useful behavior update |
| Evals | Preserve the failure as a reusable regression case |
| Changelog | Records why the behavior changed |

## Improvement Rule

Do not patch a skill only because a single response felt bad.

First identify:

- What failed?
- Which skill or router made the failure likely?
- Is this a one-off output issue or a reusable skill gap?
- What eval case would catch it next time?
- What is the smallest change that would improve behavior without making the skill heavier than needed?

## Case Privacy

Store abstracted cases, not raw private conversations.

Good:

```text
The user moved from assessment to conversation, but the assistant kept asking screening questions.
```

Bad:

```text
Full private chat transcript with identifying details.
```

## Patch Discipline

Prefer small patches:

- Add one boundary rule.
- Add one eval case.
- Clarify one trigger.
- Move a repeated behavior into a reference module.

Avoid:

- Adding a long new framework for every failure.
- Duplicating the same rule in many places.
- Turning every user preference into a global rule.
- Expanding a skill so much that it becomes hard to use.

## When to Refactor

Refactor a skill when:

- It grows much larger than peer skills.
- Several rules describe separate submodes.
- The same sections keep changing.
- Evals show the model misses parts of a long `SKILL.md`.

For large skills, prefer:

```text
skills/<skill-name>/
  SKILL.md
  references/
    mode-a.md
    mode-b.md
    boundary-c.md
```

## Current Reference Case

The first improvement-loop target is `emotional-support`.

Known failure pattern:

```text
The assistant moved into deep analysis, but kept asking many assessment-style questions, used too much structured/professional framing, and shifted too quickly into action advice.
```

The first goal is not to split the skill immediately. The first goal is to make the failure reusable as cases and evals.

