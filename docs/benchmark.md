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
node scripts/run-benchmark.js --responses benchmark-responses.json
```

Run an agent command once per case:

```bash
node scripts/run-benchmark.js --command "your-agent-command"
```

The command receives the generated benchmark prompt on stdin and should write the model response to stdout.

## Current Scope

Benchmark v0 is intentionally lightweight:

- It validates case structure.
- It can generate fresh prompts.
- It can run a configurable command per case.
- It can score saved or generated responses with simple checks.

It does not yet provide a model-as-judge. That should come after the case library is stable.

## Improvement Loop

When a benchmark fails:

1. Inspect the failed case and response.
2. Use `skill-evaluator` to classify the failure.
3. Decide whether the issue belongs to router, domain skill, eval, docs, or benchmark wording.
4. Patch the smallest useful surface.
5. Re-run the benchmark.
