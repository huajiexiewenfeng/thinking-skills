# Benchmark

## Purpose

Thinking Skills benchmarks test whether routing and domain skills behave well on fixed, realistic user scenarios.

The benchmark runner is code. The benchmark standards live in docs and eval cases. Skills should not be responsible for launching tests by themselves.

## Structure

```text
benchmarks/
  routing/
  spontaneity/
  learning-coach/
  content-creator/
  emotional-support/

scripts/
  run-benchmark.js
  update-benchmark-dashboard.js

benchmark-runs/
  example-2026-05-02.json
```

## Case Format

Benchmark cases are JSON files:

```json
{
  "id": "learning-technical-noun-001",
  "skill": "learning-coach",
  "prompt": "Explain Kafka like I am new to distributed systems.",
  "expected_route": {
    "primary": "learning-coach",
    "secondary": "technical-deep-dive"
  },
  "expected": [
    "compact mental model",
    "one example"
  ],
  "must_not": [
    "implementation details",
    "long encyclopedia"
  ],
  "quality": {
    "max_words": 500,
    "asks_at_most_questions": 1,
    "tone": "conversational"
  }
}
```

## Commands

List cases:

```bash
node scripts/run-benchmark.js --list
```

Generate prompts for an external agent:

```bash
node scripts/run-benchmark.js --prompts
```

Score saved responses:

```bash
node scripts/run-benchmark.js --responses benchmark-responses.json --out benchmark-runs/my-run.json
```

Run an agent command once per case:

```bash
node scripts/run-benchmark.js --command "your-agent-command"
```

The command receives the generated benchmark prompt on stdin and should write the model response to stdout.

Update the dashboard:

```bash
node scripts/update-benchmark-dashboard.js
```

The dashboard reads JSON reports from `benchmark-runs/` and writes `docs/benchmark-dashboard.md`.

## Dashboard Workflow

Use the dashboard when you want to compare skill quality before and after a change:

1. Save a benchmark run with `--out benchmark-runs/<date-or-change-name>.json`.
2. Run `node scripts/update-benchmark-dashboard.js`.
3. Open `docs/benchmark-dashboard.md`.
4. Compare total score, per-skill score, delta, and latest failures.

The committed `benchmark-runs/example-2026-05-02.json` is synthetic sample data. Real local runs may include private prompts or outputs, so review them before committing.

## Current Scope

Benchmark v0 is intentionally lightweight:

- It validates case structure.
- It can generate fresh prompts.
- It can run a configurable command per case.
- It can score saved or generated responses with simple checks.
- It records run metadata and can generate a Markdown dashboard for comparison across runs.

The `spontaneity/` cases are a special routing-facing set. They check whether the framework can avoid skill overuse in casual chat, play, exploratory thoughts, meta conversation, and explicit user opt-out requests. These cases protect the base model's ability to respond naturally when no domain skill is needed.

It does not yet provide a model-as-judge. That should come after the case library is stable.

## Benchmark Maturity Plan

The benchmark system should grow in stages, not jump directly into automated judgment.

### Stage 1: Case Library First

This is the current stage.

The goal is to collect realistic cases, clarify expected behavior, and make routing or skill regressions visible. At this stage, a `not_run` result is acceptable when the runner only validates case coverage and no model response is provided.

### Stage 2: Response Collection

Before adding an AI judge, benchmark runs should accumulate enough real outputs from normal use or controlled test runs. This gives the project examples of:

- Good responses worth preserving.
- Bad responses that reveal skill gaps.
- Ambiguous responses that need human judgment.
- Cases whose expectations are too vague or too strict.

### Stage 3: Codex-as-Judge

A future version may use Codex or another AI agent as a first-pass benchmark judge.

The judge should be treated as a reviewer, not as the source of truth. It can help score responses against case rubrics, explain failures, and flag responses that need human review, but it should not automatically rewrite skills, approve changes, or decide releases by itself.

Expected judge output:

- `pass`
- `fail`
- `needs_human_review`
- Short reasons tied to the benchmark case expectations.
- Suggested failure category when relevant.

Guardrails:

- Judge from explicit rubrics, not personal taste.
- Require reasons for every score.
- Keep human review for safety-sensitive, emotional-support, or unclear cases.
- Sample judge decisions periodically to prevent drift.
- Do not let a skill judge its own changes without an external rubric.

## Improvement Loop

When a benchmark fails:

1. Inspect the failed case and response.
2. Use `skill-evaluator` to classify the failure.
3. Decide whether the issue belongs to router, domain skill, eval, docs, or benchmark wording.
4. Patch the smallest useful surface.
5. Re-run the benchmark.
