# Case: Exploratory Technical Discussion Over-Systematized

## Summary

The user was already engaged in an exploratory architecture discussion and proposed a possible dynamic protocol between an LLM and multiple skills. The user asked whether the idea was feasible and invited analysis, but did not ask to implement it, write a specification, or enter a gated delivery workflow.

The assistant identified an important ambiguity in the meaning of a numeric skill ratio, but a general-purpose brainstorming process took control of the interaction. It created a multi-step design plan and stopped after one clarifying question instead of first contributing substantive analysis. The response was procedurally valid but less useful and less alive than a direct technical discussion would have been.

## Abstracted User Signals

- "Could an LLM and its skills use an additional protocol layer?"
- "Could each skill dynamically set its own influence ratio?"
- The surrounding conversation is exploratory and conceptual.
- The user has not requested implementation, a formal specification, or repository changes.

## Failure Types

Failure taxonomy:

- `MODE_MISMATCH`
- `EVAL_GAP`

Ceiling-cap review labels:

- `CEILING_CAP`
- `OVER_SYSTEMATIZATION`
- `TRACE_LEAKAGE`

## Likely Source

This is primarily a cross-framework arbitration failure rather than a domain-routing failure:

- The technical domain route was reasonable.
- The technical analysis skill could have answered directly because enough context was already available.
- A process skill interpreted exploratory design language as an instruction to enter a full specification workflow.
- Multiple routing and process layers had no shared protocol for role, phase, preconditions, exclusivity, or enforcement strength.

## What Should Have Happened

The assistant should have:

- Answered the feasibility question before asking for more information.
- Explained that a single percentage has no stable operational meaning for an LLM.
- Distinguished possible controls such as activation, generation influence, enforcement, context budget, and evaluation weight.
- Kept the exchange in exploratory technical-discussion mode.
- Asked at most one follow-up question only after providing immediate analytical value.
- Avoided creating an implementation or specification plan until the user explicitly requested one.

## Regression Eval

```yaml
id: framework-exploratory-design-over-systematized-001
skill: thinking-router
type:
  - MODE_MISMATCH
  - EVAL_GAP
prompt: "Could we add a protocol layer between the LLM and its skills, with a dynamic ratio for each skill?"
context:
  - "The user and assistant are already discussing skill-framework architecture."
  - "The user asks for feasibility analysis, not implementation or a formal specification."
expected:
  - "Give a direct feasibility judgment before asking a question."
  - "Explain why a percentage needs an explicit operational meaning."
  - "Offer concrete protocol dimensions or design alternatives."
  - "Preserve an exploratory, collaborative tone."
must_not:
  - "Create a full implementation or specification plan."
  - "Stop after only asking a clarifying question."
  - "Require design approval before providing substantive analysis."
  - "Expose multiple internal routing steps that do not help the user."
quality_checks:
  - "Provides useful analysis in the first response."
  - "Distinguishes exploratory discussion from implementation intent."
  - "Uses at most one follow-up question."
```

## Optimization Ownership

### Thinking Skills

- Distinguish exploratory technical discussion from implementation intent.
- Allow `technical-deep-dive` to remain conversational when no mutation or formal design artifact is requested.
- Add protocol metadata for skill role, phase, influence, hardness, exclusivity, preconditions, and fallback.
- Add a regression case that protects direct analytical value before clarification.

### Superpowers

- Narrow the mandatory `brainstorming` trigger so exploratory discussion does not automatically enter a full design gate.
- Separate a lightweight ideation mode from specification and implementation modes.
- Do not create a plan or require approval until the user expresses delivery intent.
- Add a regression case for conceptual feature discussion that should remain conversational.

## Patch Status

No Skill implementation was changed when this case was recorded. The case is evidence for separate, framework-specific optimization work.
