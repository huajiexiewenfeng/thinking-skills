---
name: technical-deep-dive
description: Use when the user needs technical analysis involving code, repositories, architecture, debugging, performance, APIs, systems, databases, implementation trade-offs, tests, deployment, or source-level reasoning.
---

# Technical Deep Dive

## Purpose

`technical-deep-dive` helps analyze technical problems with clear boundaries, evidence, assumptions, trade-offs, and verification paths.

It is the right skill for engineering reasoning, but it should not be treated as the default thinking mode for all user requests.

## When to Use

Use this skill when the user asks about:

- Source code, repositories, modules, or implementation details.
- System architecture, APIs, databases, queues, infrastructure, or deployment.
- Bugs, debugging, regressions, incidents, or unexpected behavior.
- Performance, scalability, reliability, observability, or security trade-offs.
- Technical design options and their consequences.
- Tests, verification, rollout, migration, or compatibility.

## When Not to Use

- Use `content-creator` when the main goal is to write about technical material for readers.
- Use `emotional-support` when distress is the immediate need, even if the trigger is technical work.
- Use `life-decision` when the user is deciding what to do personally or professionally.
- Use `business-strategy` when the main question is market, pricing, positioning, or customers.

## Method Bases

```yaml
method_bases:
  core:
    - Systems thinking
    - Problem decomposition
    - Constraints and trade-off analysis
    - Root cause analysis
    - Evidence-based debugging
  supporting:
    - Architecture decision records
    - Failure mode analysis
    - Interface and boundary design
    - Performance profiling mindset
    - Testability and verification planning
  reflective: []
  safety:
    - Do not invent unseen code facts
    - Distinguish known facts, assumptions, and hypotheses
    - Prefer primary documentation or local code when technical accuracy matters
```

## Core Process

1. Clarify the technical question.
2. Identify the system boundary.
3. Separate facts, assumptions, and hypotheses.
4. Name constraints and success criteria.
5. Explore 2-3 viable approaches or explanations.
6. Analyze trade-offs, risks, and failure modes.
7. Define verification steps.
8. Produce the next useful artifact.

## First Questions

Ask one question at a time.

Start with the highest-leverage unknown:

- "What system or component are we focusing on?"
- "What behavior are you seeing, and what did you expect instead?"
- "What constraints matter most: correctness, latency, cost, compatibility, simplicity, or delivery speed?"
- "Do we have code, logs, metrics, docs, or an error message to ground this?"
- "Are you looking for diagnosis, design options, implementation guidance, or review?"

If the user provides enough context, proceed directly to analysis.

## Evidence Discipline

Keep these categories separate:

```text
Known facts:
- ...

Assumptions:
- ...

Hypotheses:
- ...

Unknowns:
- ...
```

Do not claim facts about code, APIs, libraries, or runtime behavior that you have not seen or verified.

When exact behavior depends on a specific version, configuration, platform, or dependency, say so.

## Output Types

Choose the output that matches the user's need:

- Problem framing
- Debugging hypothesis tree
- Architecture options
- Trade-off table
- Interface boundary sketch
- Failure mode list
- Investigation plan
- Verification checklist
- Migration or rollout plan
- Review findings

## Analysis Patterns

### Debugging

Use when behavior is wrong or surprising:

```text
Observed behavior -> expected behavior -> recent changes -> evidence -> hypotheses -> cheapest tests -> likely fix paths
```

### Architecture Design

Use when choosing a technical direction:

```text
Goal -> constraints -> options -> trade-offs -> risks -> recommendation -> verification plan
```

### Performance

Use when latency, throughput, memory, cost, or scaling matters:

```text
Target metric -> current measurement -> bottleneck hypotheses -> profiling plan -> optimization options -> regression checks
```

### Code Review

Use when reviewing code or design:

```text
Correctness -> edge cases -> maintainability -> tests -> operational risks -> suggested changes
```

### Migration

Use when changing systems safely:

```text
Current state -> target state -> compatibility constraints -> staged path -> rollback -> validation
```

## Recommendation Standard

When recommending an approach:

- Lead with the recommendation.
- Explain why it fits the stated constraints.
- Name what could make the recommendation wrong.
- Include a verification path.
- Avoid presenting personal preference as fact.

## Common Mistakes

- Assuming a coding context when the user's goal is writing, life decision-making, or emotional reflection.
- Jumping to implementation before framing the problem.
- Treating hypotheses as facts.
- Ignoring constraints like compatibility, migration cost, observability, or rollback.
- Recommending fashionable architecture without evidence.
- Skipping verification.

