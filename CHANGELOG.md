# Changelog

## v0.1.0 - MVP Draft

Initial MVP draft of Thinking Skills.

Includes:

- Independent project positioning.
- English and Chinese README files.
- `thinking-router` entry skill.
- `content-creator` domain skill.
- `technical-deep-dive` domain skill.
- `emotional-support` domain skill.
- Method base design.
- Routing guide.
- Skill authoring guide.
- Evaluation guide.
- Safety guide.
- Platform support plan.
- Codex native install guide.
- Codex plugin manifest.
- Claude Code plugin metadata.
- Cursor plugin metadata.
- OpenCode plugin adapter and install guide.
- Contribution guide.
- Routing and domain skill eval cases.

Notes:

- This is a draft framework release, not a tested runtime package.
- Future versions should add `life-decision`, `creative-studio`, `learning-coach`, and `business-strategy`.

## Unreleased

- Tuned `emotional-support` toward shorter, warmer, less jargon-heavy responses.
- Clarified that psychological frameworks should guide the skill internally rather than being exposed by default.
- Added a conditional deep analysis mode for users who want a more active, tentative, and calibratable read.
- Added mode switching, assessment boundaries, question budget, action advice boundaries, and user-pushback handling to `emotional-support`.
- Added improvement-loop docs, failure taxonomy, eval schema, `skill-evaluator`, and the first abstract failure case.
- Added `docs/architecture-memory.md` for human learning and AI context recovery.
- Added `docs/architecture-memory.zh.md` Chinese version.
- Added `docs/eval-runbook.md` and completed the first documented improvement-loop diagnosis.
