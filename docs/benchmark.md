# Benchmark

## Purpose

Thinking Skills benchmarks test whether routing and domain skills behave well on fixed, realistic user scenarios.

The benchmark runner is code. The benchmark standards live in docs and eval cases. Skills should not be responsible for launching tests by themselves.

## Structure

```text
benchmarks/
  routing/
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

It does not yet provide a model-as-judge. That should come after the case library is stable.

## Improvement Loop

When a benchmark fails:

1. Inspect the failed case and response.
2. Use `skill-evaluator` to classify the failure.
3. Decide whether the issue belongs to router, domain skill, eval, docs, or benchmark wording.
4. Patch the smallest useful surface.
5. Re-run the benchmark.
