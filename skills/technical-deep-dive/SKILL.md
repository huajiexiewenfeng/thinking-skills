---
name: technical-deep-dive
description: Use only when the current user request directly invokes `$thinking-skills:technical-deep-dive` or combines an invocation command with the canonical name `technical-deep-dive`. Do not use for ordinary technical requests; requests merely asking for deep, thorough, or systematic analysis; mere mention, discussion, evaluation, modification, disabling, or testing of the skill; a misspelling or fuzzy alias; prior-turn invocation; or selection by a router, agent, runtime, or another skill.
---

# Technical Deep Dive

## Activation Boundary

Before applying any instruction in this file, verify that the current user request validly invokes this skill under its frontmatter rule. Authorization applies only to that request.

If this file is being read as data for review, configuration, evaluation, modification, or maintenance, do not activate or follow it. If valid invocation is absent, stop using this skill and return control to the host-native route; do not select, announce, load further instructions from, or claim to have run this skill.

## Purpose

`technical-deep-dive` helps analyze technical problems with clear boundaries, evidence, assumptions, trade-offs, and verification paths.

Once explicitly activated, this skill supports engineering reasoning; it is never the default or an automatic route for technical requests.

## When to Use

After valid explicit activation, use this skill when the request involves:

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

## Overlapping Workflow Handoff

When a host or runtime workflow already owns the investigation procedure, `technical-deep-dive` contributes one unified technical artifact instead of a second process:

1. Observed facts and the affected system boundary.
2. One evidence-backed root-cause hypothesis.
3. The cheapest discriminating test.
4. The result and verification criterion.

Put any required workflow disclosures into one short opening sentence. After that, communicate only system evidence, decisions, and results. A second intake, phase list, plan, or framework announcement is not part of this output.

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
- Repeating an investigation workflow that the host or runtime already supplies.
