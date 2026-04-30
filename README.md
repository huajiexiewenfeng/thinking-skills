# Thinking Skills

Independent, domain-neutral thinking skills for routing a user request into the right mode of thought.

English | [简体中文](./README.zh.md)

## The Problem

Agent skills often inherit a hidden default: they treat unclear requests as software development tasks.

That works for coding workflows, but it fails when the user is writing an article, making a life decision, exploring an emotional problem, shaping a creative idea, or asking for non-technical thinking support.

## The Solution

Thinking Skills separates routing from reasoning:

| Layer | Responsibility |
|---|---|
| `thinking-router` | Classify user intent and route to the right thinking mode |
| Domain skills | Handle the actual conversation with domain-specific questions, outputs, and safety boundaries |
| Method bases | Provide explicit frameworks instead of relying only on generic model ability |
| Evals | Test routing accuracy, domain fit, and boundary behavior |

## First-Party Skills

| Skill | Use When |
|---|---|
| `thinking-router` | A request needs to be routed to the right thinking mode |
| `content-creator` | Articles, essays, scripts, titles, outlines, arguments, audience positioning, and content structure |
| `technical-deep-dive` | Code, architecture, debugging, performance, APIs, systems, technical trade-offs, and verification paths |
| `emotional-support` | Anxiety, stress, self-blame, relationship pain, emotional confusion, crisis signals, and gentle next steps |
| `skill-evaluator` | Review failed skill responses, classify failure types, propose evals, and recommend minimal patches |

Planned skills:

- `life-decision`
- `creative-studio`
- `learning-coach`
- `business-strategy`

## Install

### Install the skill with Skills CLI:

```bash
npx skills add huajiexiewenfeng/thinking-skills
```

For local development from the repository root:

```bash
npx skills add .
```

This installs the Thinking Skills repository through the Skills CLI.

### Codex native skill discovery

See [`.codex/INSTALL.md`](.codex/INSTALL.md).

### Codex plugin

This repository includes a Codex plugin manifest:

```text
.codex-plugin/plugin.json
```

### Claude Code, Cursor, and OpenCode

This repository also includes thin platform adapters:

```text
.claude-plugin/
.cursor-plugin/
.opencode/
```

See [Platform Support](docs/platforms.md).

## Usage

After installing, restart Codex so the skills are discovered.

You can use Thinking Skills naturally:

```text
I have an idea and want to think it through.
```

```text
Help me write an article about AI companionship.
```

```text
I feel anxious and keep blaming myself.
```

```text
This API design feels wrong. Help me analyze the trade-offs.
```

To force a specific skill, name it directly:

```text
Use thinking-router to choose the right thinking mode for this request.
```

```text
Use content-creator to help me find the angle and outline.
```

```text
Use emotional-support to help me sort out what I am feeling.
```

In the current Codex session, newly installed skills may not appear until Codex is restarted.

## Core Principles

- **Domain-neutral by default** - do not assume software development.
- **Router does not solve** - route first, then let the selected skill reason.
- **Skills own their worldview** - each domain has its own questions, outputs, and boundaries.
- **Methods beat vibes** - every domain skill declares method bases.
- **One question at a time** - clarify without overwhelming the user.
- **Output follows the domain** - writing, technical analysis, and emotional support should not share one universal template.
- **Safety boundaries matter** - high-stakes domains require careful escalation and scope limits.

## How to Know It's Working

Thinking Skills is working if you see:

- Non-technical requests are no longer forced into coding workflows.
- Writing tasks produce audience, angle, thesis, and structure instead of implementation plans.
- Technical tasks separate facts, assumptions, hypotheses, trade-offs, and verification.
- Emotional-support tasks validate feelings, avoid diagnosis, and prioritize safety when needed.
- Ambiguous requests trigger one short routing question instead of a long intake form.

## Documentation

- [Roadmap](docs/roadmap.md)
- [Routing](docs/routing.md)
- [Method Bases](docs/method-bases.md)
- [Safety](docs/safety.md)
- [Evaluation](docs/evaluation.md)
- [Improvement Loop](docs/improvement-loop.md)
- [Failure Taxonomy](docs/failure-taxonomy.md)
- [Eval Schema](docs/eval-schema.md)
- [Platform Support](docs/platforms.md)
- [Skill Authoring](docs/skill-authoring.md)
- [Contributing](CONTRIBUTING.md)

## Relationship to Superpowers

Thinking Skills is independent from Superpowers.

It borrows useful ideas from skill-based workflows, but does not depend on Superpowers, its runtime, naming, or coding-first conventions.

## License

MIT
