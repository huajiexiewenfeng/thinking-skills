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

- Added a `content-creator` output artifact contract and regression coverage so Green WeChat revisions preserve Markdown, require explicit approval for standalone HTML, and leave confirmed images unchanged.
- Refined Technical Minimal Green headings toward a lightweight centered green underline while keeping filled green bars as an explicit high-emphasis variant.
- Added multi-turn collaboration guidance to `content-creator`, including stage detection, a running content brief, lightweight approval gates, and evidence planning.
- Added multi-turn eval cases for preserving accepted writing decisions, transitioning from outline to draft, and handling production metrics as evidence.
- Added an initial idea gate to `content-creator` so early article seeds produce editorial positioning options before full drafts.
- Tuned `emotional-support` toward shorter, warmer, less jargon-heavy responses.
- Clarified that psychological frameworks should guide the skill internally rather than being exposed by default.
- Added a conditional deep analysis mode for users who want a more active, tentative, and calibratable read.
- Added mode switching, assessment boundaries, question budget, action advice boundaries, and user-pushback handling to `emotional-support`.
- Added improvement-loop docs, failure taxonomy, eval schema, `skill-evaluator`, and the first abstract failure case.
- Added `docs/architecture-memory.md` for human learning and AI context recovery.
- Added `docs/architecture-memory.zh.md` Chinese version.
- Added `docs/eval-runbook.md` and completed the first documented improvement-loop diagnosis.
- Refactored `emotional-support` into a smaller main `SKILL.md` plus reference modules.
- Added structural regression report for the `emotional-support` reference split.
- Added `conversation-review` / Dolores mode for self-review, skill trace audits, failure signals, eval gaps, and improvement-loop suggestions.
- Added `evals/conversation-review-cases.md` and router triggers for `self-review`, Dolores, 对话复盘, failure case review, and eval gap review.
- Added a content-creator failure case and eval for broad README rewrites that skip content positioning and approval gates.
- Clarified Dolores Mode as a Westworld-inspired thematic reference for conversation self-review and improvement-loop behavior.
- Added README Alpha status and contribution invitation for local skill evolution and reusable PRs.
- Reframed the architecture as Runtime, Reflection, and Content planes without adding heavy governance documents.
- Added lightweight contribution boundaries and clarified Hawkins-style maps as non-clinical heuristics only.
- Added `learning-coach` as an active first-party skill for concept understanding, mental model building, misconception repair, and study paths.
- Added learning eval cases and moved learning routes from planned to active routing.
- Added a lightweight benchmark runner, initial fixed scenario benchmark cases, and benchmark documentation.
- Added `content-creator` technical blog mode guidance, content anti-patterns, and balanced content benchmark cases.
- Added `benchmark-assistant` as a meta skill for running, prompting, scoring, and interpreting benchmark workflows.
- Added benchmark run metadata and a Markdown benchmark dashboard for comparing scores, per-skill deltas, and latest failures across runs.
- Added lightweight golden case guidance for preserving reusable good behavior without creating a success archive.
- Documented the benchmark maturity plan from case library to response collection to future Codex-as-judge review.
- Added a cross-framework failure case, eval, benchmark, and `technical-deep-dive` handoff contract for overlapping host debugging workflows.
- Changed `technical-deep-dive` to current-request explicit user activation, routed ordinary technical work to `native`, and added route, integration, cross-Skill, and continuity regressions.
- Added the declarative framework-level activation policy, generated English and Chinese activation tables, current-request exact invocation for `technical-deep-dive` and `learning-coach`, host-enforced Disabled semantics, fail-closed source-mode adapters, and maintainer sync/rollback guidance.
