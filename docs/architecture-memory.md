# Thinking Skills Architecture Memory

English | [简体中文](./architecture-memory.zh.md)

This document is a compact architecture record for humans and AI agents.

Use it to learn the project quickly, recover context in a new session, or decide where a future change belongs.

## Project Identity

Thinking Skills is an independent, domain-neutral thinking skills framework.

It is inspired by skill-based agent workflows, but it is not a Superpowers fork, plugin, or coding-first methodology.

The core goal is:

```text
Route a user request into the right mode of thinking,
then let a domain skill collaborate using its own worldview,
method bases, output shape, and safety boundaries.
```

## Core Architecture

```text
User request
  -> thinking-router
  -> domain skill
  -> method bases
  -> response
  -> feedback/failure case
  -> improvement loop
```

The framework has four major layers:

| Layer | Purpose |
|---|---|
| Router | Classify intent and select a skill |
| Domain Skills | Perform domain-specific thinking |
| Method Bases | Make the underlying methods explicit |
| Improvement Flywheel | Turn failures into evals and patches |

## Directory Map

```text
skills/
  thinking-router/
  content-creator/
  technical-deep-dive/
  emotional-support/
  skill-evaluator/

docs/
  principles.md
  routing.md
  method-bases.md
  safety.md
  evaluation.md
  improvement-loop.md
  failure-taxonomy.md
  eval-schema.md
  skill-authoring.md
  platforms.md
  roadmap.md

evals/
  routing-cases.md
  content-creator-cases.md
  technical-deep-dive-cases.md
  emotional-support-cases.md
  skill-evaluator-cases.md

cases/
  emotional-support/
    assessment-to-chat-mode-mismatch.md

.codex/
.codex-plugin/
.claude-plugin/
.cursor-plugin/
.opencode/
```

## Router Layer

`thinking-router` is the entry point.

It should:

- Classify the user's request.
- Choose exactly one primary skill.
- Add at most one secondary skill.
- Ask one short routing question if confidence is low.
- Avoid assuming software development.

It should not:

- Answer the user's substantive question.
- Load multiple skills just because several keywords appear.
- Treat vague requests as technical by default.

Important routing distinction:

- A request to write about technology usually routes to `content-creator`, with `technical-deep-dive` as secondary.
- A request expressing distress about technology usually routes to `emotional-support`, with `technical-deep-dive` as secondary.
- A request for actual technical diagnosis routes to `technical-deep-dive`.

## Domain Skills

### `content-creator`

Use for:

- Articles
- Essays
- Posts
- Scripts
- Titles
- Outlines
- Arguments
- Audience positioning
- Content structure

Worldview:

```text
Writing is communication with a reader.
```

Expected outputs:

- Audience
- Angle
- Thesis
- Outline
- Hook
- Title options
- Revision direction

Main risk:

```text
Do not invent facts, citations, statistics, or personal experience.
```

### `technical-deep-dive`

Use for:

- Code
- Repositories
- Architecture
- Debugging
- Performance
- APIs
- Systems
- Databases
- Tests
- Deployment

Worldview:

```text
Technical reasoning should separate facts, assumptions, hypotheses, trade-offs, and verification.
```

Expected outputs:

- Problem framing
- Debugging hypothesis tree
- Architecture options
- Trade-off table
- Failure mode list
- Verification checklist

Main risk:

```text
Do not invent unseen code facts.
```

### `emotional-support`

Use for:

- Anxiety
- Shame
- Self-blame
- Burnout
- Relationship pain
- Emotional confusion
- Crisis signals
- Requests to understand feelings and needs

Worldview:

```text
The user needs to feel met first.
Methods guide the response internally, but should not be dumped on the user.
```

Default behavior:

- Short.
- Human.
- Low jargon.
- One question at most.
- Safety first.

Important submodes:

- Default support.
- Deep Analysis Mode.
- Assessment boundary.
- Question budget.
- Action advice boundary.
- User pushback repair.

Deep Analysis Mode:

```text
Synthesis -> correction invitation -> one calibration question only if needed
```

Not:

```text
Question -> question -> question -> conclusion
```

Main risks:

- Too many questions.
- Too much professional language.
- Too much output.
- Too much certainty.
- Advice too early.
- Continuing assessment after the user asks to chat.

### `skill-evaluator`

Use for:

- Reviewing failed skill behavior.
- Classifying failure types.
- Deciding whether to patch router, domain skill, evals, docs, or platform adapters.
- Proposing minimal changes.

Worldview:

```text
Failures should become reusable cases and evals before broad rewrites.
```

Expected outputs:

- Failure summary.
- Failure taxonomy labels.
- Likely source.
- Eval gap.
- Minimal patch plan.
- Overfitting risk.

## Method Bases

Method bases are explicit frameworks behind each skill.

They are not always shown to users.

Levels:

| Level | Meaning |
|---|---|
| Core | Primary framework |
| Supporting | Helpful secondary method |
| Reflective | Optional metaphor or self-reflection model |
| Safety | Boundary, escalation, or refusal model |

Important rule:

```text
Methods beat vibes, but methods should not become visible machinery unless helpful.
```

For emotional support, frameworks such as CBT, ACT, NVC, and trauma-informed stance should guide attention internally. Do not expose them by default.

Hawkins-style emotion maps are allowed only as reflective, non-clinical lenses.

## Safety Layer

Safety rules apply across all skills.

High-stakes domains:

- Self-harm
- Harm to others
- Abuse or coercion
- Medical risk
- Legal risk
- Financial risk
- Security risk

Core safety rule:

```text
When immediate risk appears, prioritize safety over ordinary analysis.
```

Skills must not:

- Diagnose.
- Claim to provide therapy.
- Replace professional support.
- Invent laws, medical claims, or professional standards.

## Evaluation Layer

Current evals are Markdown files in `evals/`.

They test:

- Router accuracy.
- Domain fit.
- Safety boundaries.
- Output shape.
- Negative and mixed cases.

Future evals may migrate toward YAML or JSON.

Use `docs/eval-schema.md` for structured case format.

## Improvement Flywheel

The project uses a semi-automatic improvement loop.

```text
Failure signal
  -> abstract failure case
  -> classify failure
  -> add/update eval
  -> evaluate current skill
  -> propose minimal patch
  -> apply patch
  -> update changelog
  -> retest
```

Failure cases should be abstracted.

Do not store raw private conversations.

First recorded case:

```text
cases/emotional-support/assessment-to-chat-mode-mismatch.md
```

## Failure Taxonomy

Important failure labels:

| Label | Meaning |
|---|---|
| `ROUTING_MISS` | Wrong skill selected |
| `MODE_MISMATCH` | Right skill, wrong submode |
| `QUESTION_OVERLOAD` | Too many questions |
| `JARGON_EXPOSURE` | Too much professional language |
| `OVER_OUTPUT` | Response too long |
| `PREMATURE_ADVICE` | Advice too early |
| `CERTAINTY_OVERREACH` | Guess stated too strongly |
| `ASSESSMENT_STUCK` | Kept testing/scoring after user wanted conversation |
| `SAFETY_MISS` | Safety risk missed |
| `DOC_OVERLOAD` | Skill document too heavy |

## Platform Adapters

The canonical skill content is always in:

```text
skills/
```

Platform folders are thin adapters:

```text
.codex/
.codex-plugin/
.claude-plugin/
.cursor-plugin/
.opencode/
```

Codex has been locally verified through Skills CLI discovery.

Claude Code, Cursor, and OpenCode adapters exist, but should be treated as implemented metadata/adapters until tested in those clients.

## Current Known Design Debt

### `emotional-support` is too large

Current size is much larger than peer skills.

It should eventually be split into:

```text
skills/emotional-support/
  SKILL.md
  references/
    default-response.md
    deep-analysis-mode.md
    assessment-boundary.md
    safety-boundary.md
    question-budget.md
    action-advice-boundary.md
```

Do not split it blindly. Use the improvement flywheel and eval cases to decide the split.

### Platform adapters need real client tests

Codex discovery was tested locally.

Claude Code, Cursor, and OpenCode should be tested in their actual runtimes.

### Roadmap status should distinguish levels

Future status labels should distinguish:

```text
Implemented
Locally verified
Client verified
```

## Next Recommended Work

1. Use `skill-evaluator` on recent `emotional-support` failures.
2. Convert the first abstract failure case into structured eval blocks.
3. Refactor `emotional-support` into references only after eval coverage is good enough.
4. Add `life-decision` after the improvement flywheel feels stable.
5. Test Claude Code, Cursor, and OpenCode adapters in real clients.

## AI Session Bootstrap

When an AI agent needs to continue work on this repository, read this file first.

Then read only the files needed for the task:

- Router change: `skills/thinking-router/SKILL.md`, `evals/routing-cases.md`
- Emotional support change: `skills/emotional-support/SKILL.md`, `evals/emotional-support-cases.md`, relevant `cases/`
- Skill failure review: `skills/skill-evaluator/SKILL.md`, `docs/failure-taxonomy.md`, `docs/improvement-loop.md`
- Platform change: `docs/platforms.md`, relevant platform folder
- Roadmap change: `docs/roadmap.md`, `CHANGELOG.md`
