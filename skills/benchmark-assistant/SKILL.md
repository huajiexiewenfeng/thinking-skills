---
name: benchmark-assistant
description: Use when the user wants to run Thinking Skills benchmarks, test a skill, check regressions, generate benchmark prompts, score saved benchmark responses, update or compare the benchmark dashboard, add a benchmark case, interpret benchmark results, or decide what to patch after a benchmark failure.
---

# Benchmark Assistant

## Purpose

`benchmark-assistant` helps the user actually use the benchmark runner.

It is a meta skill. It does not replace `scripts/run-benchmark.js`, and it does not define domain quality by itself. It chooses useful benchmark commands, runs or prepares them, explains results, and hands failure diagnosis to `skill-evaluator` when needed.

## When to Use

Use this skill when the user says things like:

- "Run benchmark."
- "Test content-creator."
- "Check learning-coach regression."
- "Generate benchmark prompts."
- "Score these benchmark responses."
- "Update benchmark dashboard."
- "Compare the latest benchmark runs."
- "Add this failure to benchmark."
- "What failed in benchmark?"
- "I changed a skill, help me test it."
- "帮我测一下这个 skill."
- "跑一下 benchmark."

## When Not to Use

- Use `skill-evaluator` directly when the user already has a specific failed response and wants a failure diagnosis.
- Use the relevant domain skill when the user wants the substantive task answered, not benchmarked.
- Do not create a new benchmark framework when the existing runner is enough.

## Required Context

Read these files when needed:

- `docs/benchmark.md`
- `docs/benchmark-dashboard.md` when comparing runs
- `scripts/run-benchmark.js`
- `scripts/update-benchmark-dashboard.js`
- `benchmark-runs/` when the user asks for historical comparison
- Relevant `benchmarks/<skill>/` cases
- Relevant `evals/<skill>-cases.md`
- `skills/skill-evaluator/SKILL.md` when failures need diagnosis

## Core Workflow

1. Identify the target:
   - All benchmarks
   - One skill directory, such as `benchmarks/content-creator`
   - A specific failure or proposed new case
2. Choose the lightest useful command.
3. Run the command if it does not require external credentials or unknown agent setup.
4. If no external agent command is configured, generate prompts or ask for saved responses instead of pretending the benchmark was run.
5. If the user wants trend comparison, update `docs/benchmark-dashboard.md` from `benchmark-runs/`.
6. Summarize results in plain language.
7. If failures appear, classify whether the likely source is:
   - Router
   - Domain skill
   - Eval or benchmark wording
   - Missing response data
   - External agent setup
8. Recommend the smallest next action.

## Common Commands

List all cases:

```bash
node scripts/run-benchmark.js --list
```

List cases for one skill:

```bash
node scripts/run-benchmark.js --cases benchmarks/content-creator --list
```

Generate prompts:

```bash
node scripts/run-benchmark.js --prompts
```

Generate prompts for one skill:

```bash
node scripts/run-benchmark.js --cases benchmarks/content-creator --prompts
```

Score saved responses:

```bash
node scripts/run-benchmark.js --responses benchmark-responses.json --out benchmark-runs/my-run.json
```

Run an external agent command:

```bash
node scripts/run-benchmark.js --command "your-agent-command"
```

Update dashboard:

```bash
node scripts/update-benchmark-dashboard.js
```

## Output Format

For normal benchmark runs, respond with:

```markdown
## Benchmark Result

Command:

Summary:

Key failures:

Next action:
```

For prompt generation, respond with:

```markdown
## Benchmark Prompts

Command:

Cases:

How to use:
```

For failures, respond with:

```markdown
## Failure Triage

Failed case:

Likely source:

Existing coverage:

Smallest useful patch:

Should this become a failure case?
```

For dashboard updates, respond with:

```markdown
## Benchmark Dashboard

Command:

Updated file:

Latest score:

Largest changes:

Next action:
```

## Safety and Scope

- Do not claim a live benchmark ran when only prompts were generated.
- Do not claim a skill passed if the run returned `not_run`.
- Do not automatically commit benchmark results or patches.
- Do not include private raw conversations in benchmark cases; abstract them first.
- Keep benchmark cases small and realistic.
- Preserve local drafts such as `articles/` and `docs/superpowers/` unless the user explicitly asks to commit them.

## Common Mistakes

- Treating `--prompts` output as a completed benchmark.
- Running all benchmarks when the user only changed one skill.
- Patching a skill when the benchmark case wording is the real issue.
- Adding a new case without `expected`, `must_not`, and quality boundaries.
- Making benchmark work heavier than the actual skill change.
