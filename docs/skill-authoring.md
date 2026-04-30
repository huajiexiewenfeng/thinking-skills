# Skill Authoring

## What Is a Thinking Skill?

A thinking skill is a reusable thinking protocol for a domain or mode of work.

It is not a story about one previous conversation. It is not a bag of prompts. It should help an agent reliably choose better questions, better reasoning frames, and better outputs for a class of user requests.

## Required File

Every skill lives in its own directory:

```text
skills/<skill-name>/
  SKILL.md
```

## Naming

Use lowercase words separated by hyphens:

```text
content-creator
technical-deep-dive
emotional-support
life-decision
```

Prefer names that describe the thinking mode, not the implementation mechanism.

## Frontmatter

Each `SKILL.md` starts with YAML frontmatter:

```yaml
---
name: content-creator
description: Use when the user is developing articles, essays, posts, scripts, talks, titles, outlines, arguments, audience positioning, or content structure.
---
```

The description should describe when to use the skill. It should not summarize the whole workflow.

## Recommended Structure

```markdown
# Skill Name

## Purpose

One or two sentences explaining the domain worldview.

## When to Use

Concrete signals and request types.

## When Not to Use

Adjacent domains that should route elsewhere.

## Core Process

The thinking flow this skill follows.

## Method Bases

The frameworks, methods, and safety models this skill relies on.

## First Questions

The first few questions this skill tends to ask, one at a time.

## Outputs

The kinds of outputs this skill can produce.

## Safety and Boundaries

Refusals, redirects, or professional-support boundaries.

## Common Mistakes

Ways the agent may misuse this skill.
```

## Skill Quality Checklist

- The skill has a clear domain.
- The description has concrete trigger words.
- The skill declares its method bases.
- The skill does not assume software development unless it is a technical skill.
- The skill asks one question at a time.
- The skill has a distinct output shape.
- The skill says when not to use it.
- The skill defines safety boundaries when needed.
- The skill has at least three evaluation cases before being considered stable.

## Testing a Skill

Create evaluation cases before treating a skill as reliable:

- Clear positive cases where the skill should trigger.
- Negative cases where a different skill should trigger.
- Mixed-intent cases where one primary and one secondary skill may apply.
- Ambiguous cases where the router should ask a clarifying question.

Store cases in `evals/<skill-name>-cases.md`.

## Method Base Requirements

Every first-party domain skill should declare its method bases.

Use these categories:

- `core` - primary methods the skill depends on.
- `supporting` - secondary methods used when helpful.
- `reflective` - non-clinical or metaphorical lenses.
- `safety` - boundaries, escalation rules, and refusal logic.

Do not present every model as equally authoritative. For example, a clinical or evidence-informed method can be a core base for emotional support, while a spiritual emotion map should be marked as reflective.

See `docs/method-bases.md`.
