# Conversation Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `conversation-review` as Dolores mode for reviewing skill traces, failure signals, eval gaps, and improvement-loop actions across a prior conversation.

**Architecture:** Introduce a new first-party skill for conversation-level self-review. Keep `skill-evaluator` responsible for failure taxonomy and patch discipline, while `conversation-review` owns the broader conversation trace and Dolores/self-review trigger surface.

**Tech Stack:** Markdown skill files, Markdown eval cases, existing Thinking Skills docs and README structure.

---

### Task 1: Add the Conversation Review Skill

**Files:**
- Create: `skills/conversation-review/SKILL.md`

- [x] Create a focused `SKILL.md` with frontmatter, purpose, use cases, non-use cases, Dolores modes, core process, method bases, outputs, boundaries, and common mistakes.
- [x] Include `self-review` as the primary trigger, `Dolores` as the mode name, and aliases such as `自我检查`, `自我复盘`, `对话复盘`, `skill 使用复盘`, `eval gap review`, and `improvement loop`.
- [x] Define three output levels: light self-review, failure-focused review, and full Dolores review.

### Task 2: Add Evaluation Coverage

**Files:**
- Create: `evals/conversation-review-cases.md`

- [x] Add positive cases for `self-review`, fact-correction review, failure-case extraction, and full Dolores mode.
- [x] Add negative cases where ordinary summary, active emotional distress, or direct technical work should not trigger `conversation-review`.
- [x] Add quality checks for privacy, concise output, skill trace accuracy, and minimal patch discipline.

### Task 3: Update Routing and Documentation

**Files:**
- Modify: `skills/thinking-router/SKILL.md`
- Modify: `README.md`
- Modify: `docs/architecture-memory.md`
- Modify: `docs/roadmap.md`
- Modify: `CHANGELOG.md`

- [x] Add conversation-review trigger signals to the router table and mixed-intent examples.
- [x] Add `conversation-review` to the first-party skill list and usage examples.
- [x] Update architecture memory to include the Dolores layer after response sequences.
- [x] Update roadmap/progress trackers with the new skill and eval file.
- [x] Add an Unreleased changelog entry.

### Task 4: Verify

**Files:**
- Inspect all changed Markdown files.

- [x] Run a recursive file listing to confirm `skills/conversation-review/SKILL.md` and `evals/conversation-review-cases.md` exist.
- [x] Search for `conversation-review`, `Dolores`, and `self-review` to confirm the trigger appears in skill, evals, router, and docs.
- [x] Run `git diff --check` to catch whitespace errors.
