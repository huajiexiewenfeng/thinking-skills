# Roadmap

## Final Goal

Thinking Skills is an independent, domain-neutral thinking framework. It routes a user request to the right thinking mode, then uses that domain's questions, judgment standards, output shape, and safety boundaries to collaborate with the user.

The final system is:

```text
Intent Router + Domain Thinking Skills + Skill Authoring Standard + Evaluation Cases
```

## Non-Goals

- It is not a Superpowers fork.
- It is not a coding-first methodology.
- It is not a generic prompt collection.
- It does not force all problems into specs, implementation plans, tests, or commits.
- It does not replace professional help in medical, legal, financial, or mental health situations.

## Complete Architecture

```text
thinking-skills/
  README.md
  LICENSE
  ATTRIBUTION.md

  skills/
    thinking-router/
      SKILL.md

    content-creator/
      SKILL.md
    technical-deep-dive/
      SKILL.md
    emotional-support/
      SKILL.md
    skill-evaluator/
      SKILL.md
    life-decision/
      SKILL.md
    creative-studio/
      SKILL.md
    learning-coach/
      SKILL.md
    business-strategy/
      SKILL.md

  docs/
    principles.md
    architecture-memory.md
    architecture-memory.zh.md
    routing.md
    method-bases.md
    platforms.md
    improvement-loop.md
    failure-taxonomy.md
    eval-schema.md
    skill-authoring.md
    evaluation.md
    safety.md
    roadmap.md

  evals/
    routing-cases.md
    content-creator-cases.md
    technical-deep-dive-cases.md
    emotional-support-cases.md
    skill-evaluator-cases.md
    life-decision-cases.md

  cases/
    emotional-support/
      assessment-to-chat-mode-mismatch.md
```

## Version Plan

| Version | Scope | Goal |
|---|---|---|
| v0.1 MVP | `thinking-router`, `content-creator`, `technical-deep-dive`, `emotional-support`, core docs | Prove the framework is domain-neutral and the routing model works |
| v0.2 | Codex native install and Codex plugin support | Make Thinking Skills easy to install and discover in Codex |
| v0.3 | Add `life-decision` and `creative-studio` | Cover everyday decisions and open-ended creative work |
| v0.4 | Add eval cases for router and expanded skills | Test whether routing and skill behavior are reliable |
| v0.5 | Add Claude Code, Cursor, and OpenCode adapters | Broaden platform support without forking skill content |
| v0.6 | Add improvement loop, failure taxonomy, eval schema, and `skill-evaluator` | Make skill improvement semi-automatic and reusable |
| v0.7 | Add method base and safety refinements | Make skill methods explicit and handle high-stakes boundaries more carefully |
| v1.0 | Stable docs, stable first-party skills, eval set, contribution model | Ready for public use and contribution |

## MVP Progress Tracker

| Task | File | Status |
|---|---|---|
| Define project positioning | `README.md` | Done |
| Add Chinese README | `README.zh.md` | Done |
| Write final goal and roadmap | `docs/roadmap.md` | Done |
| Write architecture memory | `docs/architecture-memory.md` | Done |
| Write Chinese architecture memory | `docs/architecture-memory.zh.md` | Done |
| Write core principles | `docs/principles.md` | Done |
| Write routing rules | `docs/routing.md` | Done |
| Write method base design | `docs/method-bases.md` | Done |
| Write platform support plan | `docs/platforms.md` | Done |
| Write skill authoring standard | `docs/skill-authoring.md` | Done |
| Write attribution note | `ATTRIBUTION.md` | Done |
| Add license | `LICENSE` | Done |
| Write evaluation guide | `docs/evaluation.md` | Done |
| Write contribution guide | `CONTRIBUTING.md` | Done |
| Add changelog | `CHANGELOG.md` | Done |
| Add Codex native install guide | `.codex/INSTALL.md` | Done |
| Add Codex plugin manifest | `.codex-plugin/plugin.json` | Done |
| Add Claude Code plugin metadata | `.claude-plugin/` | Done |
| Add Cursor plugin metadata | `.cursor-plugin/` | Done |
| Add OpenCode plugin adapter | `.opencode/` | Done |
| Write router skill | `skills/thinking-router/SKILL.md` | Done |
| Write content skill | `skills/content-creator/SKILL.md` | Done |
| Write technical skill | `skills/technical-deep-dive/SKILL.md` | Done |
| Write emotional support skill | `skills/emotional-support/SKILL.md` | Done |
| Add routing eval cases | `evals/routing-cases.md` | Done |
| Add content eval cases | `evals/content-creator-cases.md` | Done |
| Add technical eval cases | `evals/technical-deep-dive-cases.md` | Done |
| Add emotional support eval cases | `evals/emotional-support-cases.md` | Done |
| Write improvement loop guide | `docs/improvement-loop.md` | Done |
| Write failure taxonomy | `docs/failure-taxonomy.md` | Done |
| Write eval schema | `docs/eval-schema.md` | Done |
| Write skill evaluator | `skills/skill-evaluator/SKILL.md` | Done |
| Add skill evaluator eval cases | `evals/skill-evaluator-cases.md` | Done |
| Add abstract failure cases | `cases/` | Done |

## v1.0 Progress Tracker

| Module | Completion Standard | Status |
|---|---|---|
| Framework docs | README, principles, routing, method bases, authoring, evaluation, safety, roadmap are complete | Done |
| Router | Handles domain classification, uncertainty, and conflicts | Done |
| MVP skills | Four first-party skills are written and tested with examples | Done |
| Expanded skills | `life-decision`, `creative-studio`, `learning-coach`, `business-strategy` exist | Todo |
| Evaluations | Each first-party skill has at least five realistic test cases | Done |
| Safety | High-stakes domains have explicit boundaries and escalation guidance | Done |
| Contribution model | New skill checklist and contribution criteria are documented | Done |
| Release | License, attribution, version notes, and stable directory structure exist | Done |
| Platform adapters | Codex, Claude Code, Cursor, and OpenCode adapters exist | Done |
| Improvement flywheel | Failure taxonomy, eval schema, skill evaluator, and abstract cases exist | Done |

## Completion Criteria for v0.1

v0.1 is complete when:

- The router can classify at least the three MVP domains: content, technical, and emotional support.
- Each MVP skill has a distinct worldview and output shape.
- Each MVP skill declares method bases with clear evidence and safety boundaries.
- The framework docs clearly state that Thinking Skills is independent and domain-neutral.
- The progress tracker is updated.
- At least ten routing cases exist, including ambiguous and mixed-intent requests.
