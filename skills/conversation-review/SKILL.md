---
name: conversation-review
description: Use when the user asks for self-review, Dolores mode, conversation review, skill trace audit, failure analysis, eval gap detection, or improvement-loop suggestions for a prior conversation.
---

# Conversation Review

## Purpose

`conversation-review` reviews a prior conversation as a skill trace.

It identifies which thinking skills were triggered, whether routing and modes were appropriate, what failure signals appeared, and which improvement-loop actions would make the system better.

Mode name:

```text
Dolores
```

Worldview:

```text
A conversation is not only an answer stream. It is an observable thinking trace.
```

## When to Use

Use this skill when the user asks for:

- `self-review`
- Dolores mode
- 自我检查
- 自我复盘
- 对话复盘
- skill 使用复盘
- review this conversation
- audit skill usage
- failure case review
- eval gap review
- improvement loop
- patch strategy based on the conversation
- whether a prior exchange should be added as an eval or failure case

Also use it when the user corrects a prior answer and asks what should improve.

## When Not to Use

Do not use this skill when:

- The user only asks for a normal summary.
- The user is currently distressed and needs immediate emotional support.
- The user asks for direct technical diagnosis or implementation.
- The user asks for article structure, titles, or prose without asking to review the conversation.
- There is not enough prior context to review; ask for the relevant exchange or state the limitation.

## Relationship to Other Skills

`conversation-review` owns conversation-level review.

`skill-evaluator` owns detailed failure classification, eval gap diagnosis, and minimal patch discipline.

Use `conversation-review` as the primary skill when the object of review is the whole conversation. Use `skill-evaluator` as the primary skill when the user provides a specific failed response and wants a failure diagnosis.

## Dolores Modes

### Light Self-Review

Use when the user says:

```text
self-review
自我检查一下
自我复盘一下
```

Output:

```markdown
## Skill Trace

## What Worked

## Failure Signals

## Improvement Suggestion
```

Keep it short. Prefer one or two improvement points.

### Failure-Focused Review

Use when the user asks whether something should become a failure case, eval case, or patch.

Output:

```markdown
## Diagnosis

Failure summary:
Failure types:
Likely source:

## Eval Candidate

Abstract case:
Expected behavior:
Must not:

## Patch Strategy

Smallest useful change:
Files likely affected:
Risk:
```

Do not preserve raw private conversation text. Abstract the case.

### Full Dolores Review

Use when the user says:

```text
Dolores
进入 Dolores
full Dolores review
深度复盘
```

Output:

```markdown
## Conversation Trace

## Skill Trace

## Mode Shifts

## What Worked

## Failure Signals

## Eval Gaps

## Patch Strategy

## Dolores Note
```

`Dolores Note` should be one sentence that names the deeper pattern of the conversation.

## Core Process

1. Identify the user's requested review depth.
2. Reconstruct the conversation arc from available context.
3. List skills that were triggered or should have been triggered.
4. Check routing, mode fit, output shape, evidence discipline, and safety boundaries.
5. Separate what worked from what failed.
6. Classify failures when useful.
7. Propose eval candidates only for reusable patterns.
8. Recommend the smallest useful patch or next improvement step.

## Method Bases

```yaml
method_bases:
  core:
    - Conversation trace analysis
    - Skill routing audit
    - Failure taxonomy
    - Regression-case thinking
    - Minimal patch discipline
  supporting:
    - Improvement-loop review
    - Skill authoring checklist
    - Evidence and assumption separation
  safety:
    - Do not store raw private conversations as cases
    - Abstract sensitive examples before proposing evals
    - Prioritize active safety needs over retrospective review
```

## First Questions

Ask at most one question if needed:

- "Do you want a light self-review or a full Dolores review?"
- "Should I focus on skill usage, failure cases, or improvement patches?"
- "Can you provide the exchange you want reviewed?"

If the user's trigger is clear, do not ask a question.

## Outputs

This skill can produce:

- Skill trace
- Mode shift analysis
- Failure signal summary
- Eval candidate
- Improvement-loop action list
- Minimal patch strategy
- Dolores Note

## Boundaries

- Do not turn every disliked phrase into a global rule.
- Do not claim exact skill usage when the conversation context is unavailable.
- Do not make the review longer than the conversation warrants.
- Do not continue retrospective review if the user expresses immediate distress or safety risk.
- Do not rewrite other skills by default; recommend patches first.

## Common Mistakes

- Treating normal summaries as Dolores review.
- Producing a long audit when the user asked for light self-review.
- Blaming the router when the issue was a domain skill mode mismatch.
- Blaming a domain skill when the user actually asked for a different primary task.
- Storing raw private conversation content as a case.
- Adding broad skill rules from one narrow example.
