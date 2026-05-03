# Improvement Loop

## Purpose

Thinking Skills should improve through real failures and preserve real successes, not only through intuition.

The improvement loop turns user feedback, failed conversations, and rare golden patterns into reusable eval cases, diagnosis, minimal patches, preservation actions, and changelog entries.

This project currently targets a semi-automatic loop: humans provide judgment and real examples; AI helps classify failures, draft evals, and propose small skill changes.

`conversation-review` / Dolores mode can be used before this loop when the useful unit of analysis is a whole conversation rather than one failed response.

## Loop

```text
Failure signal
  -> optional conversation-review / Dolores
  -> abstract failure case
  -> classify failure
  -> add or update eval
  -> evaluate current skill
  -> propose minimal patch
  -> apply patch
  -> update changelog
  -> retest
```

Positive preservation uses a lighter path:

```text
Golden signal
  -> optional conversation-review / Dolores
  -> golden candidate
  -> skill-evaluator conflict check
  -> convert to eval, skill rule, retained golden case, or discard
```

## What Counts as a Failure Signal?

- User says the response felt wrong, too long, too clinical, too shallow, too technical, or too solution-oriented.
- The router chooses the wrong skill.
- A domain skill exposes too much framework jargon.
- The response asks too many questions.
- The response misses safety boundaries.
- The response solves a different problem from the one the user wanted.
- The response works once but is not general enough.

## What Counts as a Golden Signal?

- User says a response worked especially well and should be preserved.
- A skill proves it can independently handle a core scenario.
- A reusable collaboration pattern appears.
- A subtle style or judgment pattern is likely to be broken by future changes.

Ordinary satisfaction is not enough. Do not record praise; record reusable behavior.

## Roles

| Role | Responsibility |
|---|---|
| Human reviewer | Provides feedback, decides whether the behavior is acceptable |
| `conversation-review` | Reviews a prior conversation as a skill trace and identifies reusable failure signals, golden signals, or eval gaps |
| `skill-evaluator` | Classifies failure type, checks golden candidates for conflicts, and recommends a minimal patch or preservation action |
| Domain skill | Receives the smallest useful behavior update |
| Evals | Preserve failures and golden patterns as reusable regression cases |
| Golden cases | Preserve rare reusable behavior that is too subtle to fully encode as a rule |
| Changelog | Records why the behavior changed |

## Improvement Rule

Do not patch a skill only because a single response felt bad.

First identify:

- What failed?
- Which skill or router made the failure likely?
- Is this a one-off output issue or a reusable skill gap?
- What eval case would catch it next time?
- What is the smallest change that would improve behavior without making the skill heavier than needed?

## Preservation Rule

Do not create a golden case only because a single response felt good.

First identify:

- What reusable behavior worked?
- When should this behavior apply?
- When should it not apply?
- Does an existing eval or skill rule already preserve it?
- Would recording it create conflict with a failure case?
- Is this better as an eval, a skill rule, a retained golden case, or no action?

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

For golden cases, also avoid storing full articles, drafts, or sensitive personal material.

## Patch Discipline

Prefer small patches:

- Add one boundary rule.
- Add one eval case.
- Add one golden case only for reusable behavior.
- Clarify one trigger.
- Move a repeated behavior into a reference module.

Avoid:

- Adding a long new framework for every failure.
- Duplicating the same rule in many places.
- Turning every user preference into a global rule.
- Turning every liked response into a golden case.
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
