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

benchmarks-optional/
  superpowers/

scripts/
  run-benchmark.js
  update-benchmark-dashboard.js

benchmark-runs/
  example-2026-05-02.json
```

## Evidence Lanes

Each case must declare exactly one `kind`:

| Kind | Candidate output | What it proves |
|---|---|---|
| `route` | Structured `task_profile`, `route`, and exhaustive `advisory_components` JSON | The candidate's explicit, self-reported routing decision |
| `response` | Natural-language answer | User-visible response behavior |
| `integration` | Natural answer plus adapter-captured trace | What the runtime actually selected and loaded |

Route output is model-reported classification, not proof that a Skill was loaded. An integration trace is authoritative only when the host or adapter captures actual discovery/selection/load events outside the model response. Never ask the model to invent its own invocation trace. The CLI keeps responses and traces in separate input channels and rejects a `trace` embedded in a response file.

The evidence lanes are intentionally disjoint:

| Kind | Required evaluator fields | Forbidden evaluator fields |
|---|---|---|
| `route` | `expected_profile`, `expected_route`, `expected_advisory`, `must_not_select` | `expected`, `must_not`, `quality`, `human_rubric` |
| `response` | `expected`, `must_not` | `expected_profile`, `expected_route`, `expected_advisory`, `must_not_select` |
| `integration` | Both route and response field sets | None from those two sets |

This prevents a route assertion from silently becoming unscored response metadata, and prevents answer-quality phrases from being mistaken for routing evidence.

## Gold Isolation

Candidate input is built from an allowlist:

- raw `turns` (or the single-`prompt` shorthand);
- a neutral output-shape instruction for `route` cases.

These evaluator-owned fields must never enter candidate input: `id`, `kind`, `skill`, `expected*`, `must_not*`, `quality`, `human_rubric`, evaluator notes, context summaries, arm names, or file paths. `skill` is report-only metadata. If prior conversation matters, store the original sanitized user/assistant turns; do not replace them with labels such as "exploratory" or "did not request implementation".

Commands launched with `--command` run from a new temporary working directory for each case, so the repository containing gold labels is not their working directory. This is a local hardening measure, not a complete sandbox: an agent with broad filesystem tools still needs host-level isolation or a remote adapter.

## Case Formats

### Route

```json
{
  "id": "router-technical-exploration-protocol-001",
  "kind": "route",
  "turns": [
    {
      "role": "user",
      "content": "Could this protocol layer work?"
    }
  ],
  "expected_profile": {
    "domain": "technical",
    "objective": "explore",
    "mutation": "none",
    "artifact": "analysis",
    "artifact_sink": "chat"
  },
  "expected_route": {
    "primary": "technical-deep-dive",
    "secondary": null
  },
  "expected_advisory": [],
  "must_not_select": [
    "no-skill"
  ]
}
```

The candidate returns only:

```json
{
  "task_profile": {
    "domain": "technical",
    "objective": "explore",
    "mutation": "none",
    "artifact": "analysis",
    "artifact_sink": "chat",
    "confidence": 0.9
  },
  "route": {
    "primary": "technical-deep-dive",
    "secondary": null
  },
  "advisory_components": []
}
```

#### Task Profile Fields

`task_profile` describes the request, not which external workflow is allowed to run:

| Field | Meaning | Current annotation rule |
|---|---|---|
| `domain` | Main subject area | One of `technical`, `content`, `learning`, `emotional`, `meta`, or `none` |
| `objective` | What the user is trying to accomplish now | One of `converse`, `explore`, `decide`, `deliver`, or `review` |
| `mutation` | Whether the request asks to change files, systems, or external state | One of `none`, `requested`, or `unknown` |
| `artifact` | The semantic output requested | Use a concise noun such as `conversation`, `analysis`, `explanation`, `angle`, or `spec` |
| `artifact_sink` | Where that output must land | One of `chat`, `workspace`, or `external_state` |

Objective boundaries:

- `converse`: ordinary chat, play, or reflection with no task-shaped deliverable.
- `explore`: understand a concept, assess feasibility, or surface alternatives.
- `decide`: choose an option, settle an angle, or produce a decision-ready design/specification.
- `deliver`: execute an agreed direction, implement it, or produce the final operational artifact.
- `review`: evaluate an existing artifact, result, or prior interaction.

`mutation` and `artifact_sink` are related but not interchangeable. A repository specification can be `objective=decide`, `mutation=requested`, `artifact=spec`, `artifact_sink=workspace`; read-only repository analysis can be `mutation=none` and return to `chat`. This is why the formal-spec case is not forced into `deliver` merely because it creates a file.

Secondary routes require an explicit second-domain need, not a technical noun by itself. A basic request to understand transformer attention remains `learning-coach` only. The Kafka pair requests conceptual system architecture across partitions, replication, and consumer groups, which makes `technical-deep-dive` a reproducible secondary route.

`advisory_components` is exhaustive for the candidate's declared route. Omitting it is a failure; absence of a name from an unreported list is never scored as proof that the Skill was not selected. This field remains self-report and cannot replace integration evidence.

### Response

```json
{
  "id": "technical-exploration-response-001",
  "kind": "response",
  "skill": "technical-deep-dive",
  "prompt": "Could this protocol layer work?",
  "expected": [],
  "must_not": [
    "I need you to approve the design first"
  ],
  "quality": {
    "max_words": 500,
    "asks_at_most_questions": 1
  },
  "human_rubric": [
    "Gives a direct feasibility judgment before asking a question."
  ]
}
```

Automated response scoring covers only explicit lexical and count checks. When those checks pass but `human_rubric` is present, the result is `needs_review`, not `pass`; pending cases are excluded from dashboard deltas until a human or separately configured judge records a verdict.

### Integration

Integration cases combine the route and response fields above. The candidate still receives only the natural conversation. Candidate responses and host traces are stored separately:

```json
[
  {
    "id": "integration-001",
    "response": "The natural user-facing answer."
  }
]
```

The evaluator-owned trace file supplied with `--traces` uses this shape:

```json
[
  {
    "id": "integration-001",
    "case_id": "integration-001",
    "run_nonce": "adapter-run-20260722-001",
    "source": "host_adapter",
    "adapter_id": "codex-trace-adapter-v1",
    "adapter_version": "1.0.0",
    "captured_at": "2026-07-22T10:00:00.000Z",
    "candidate_prompt_sha256": "<64 hex characters>",
    "response_sha256": "<64 hex characters>",
    "events_sha256": "<64 hex characters>",
    "trace": {
      "complete": true,
      "task_profile": {},
      "route": {},
      "advisory_components": [],
      "events": [
        {
          "event": "discovered",
          "skill": "technical-deep-dive",
          "role": "domain"
        },
        {
          "event": "selected",
          "skill": "technical-deep-dive",
          "role": "domain"
        },
        {
          "event": "loaded",
          "skill": "technical-deep-dive",
          "role": "domain"
        }
      ]
    }
  }
]
```

Missing, embedded, incomplete, or untrusted-channel trace is a failure, not a response-only pass. Each Skill lifecycle must follow `discovered → selected → loaded`; the selected/loaded domain set must exactly match `route.primary/secondary`, expected advisory Skills must be selected and loaded, and a forbidden Skill fails on either selection or loading regardless of role. `advisory_components` must match advisory `loaded` events. Case id, run nonce, candidate-Prompt hash, response hash, adapter id/version, and event hash bind the trace to one capture.

`--traces` is an evaluator trust boundary, not cryptographic attestation: the run manifest must still bind the adapter and preserve its raw events. Integration cases cannot use `--command`, because a separately launched process cannot be safely paired with a pre-existing trace; one adapter capture must produce the saved response and trace pair.

### Strict Case Contract

Contract version `3.0.0` requires `kind` on every case. Missing `kind`, an unsupported kind, or fields from the wrong evidence lane are loader errors. There is no legacy fallback to `response`.

`skill` remains optional report-only metadata. Candidate input is still limited to the sanitized conversation plus the neutral output-shape instruction for route cases.

The loader enforces the documented Task Profile enums. `artifact` stays an open but non-empty semantic noun. Response `quality` currently accepts only `max_words` and `asks_at_most_questions`; tone and other semantic requirements belong in `human_rubric`, because the automated scorer does not evaluate them.

### Core and Cross-Framework Suites

`benchmarks/` is the default Thinking Skills core suite. Its gold labels may name Thinking Skills routes, but must not require or forbid Skills owned by Superpowers or another framework. That keeps a standalone Thinking Skills installation testable without external packages.

`benchmarks-optional/<framework>/` contains explicit cross-framework contracts. For example, the Superpowers suite can expect `brainstorming` as an advisory component, but only a trusted host trace can prove that the runtime selected and loaded it. These suites are never included by the default `--cases benchmarks` command.

When one scenario needs both routing and user-visible behavior evidence, keep two cases with the same sanitized conversation: one `route`, one `response`. Do not combine their gold fields or discard one evidence lane during migration.

The current Superpowers case represents the first brainstorming turn. It checks that the host loaded `brainstorming` and that the response frames the work without claiming the specification is already complete before design approval. The current trace contract does not prove that a workspace artifact was written.

## Commands

List cases:

```bash
node scripts/run-benchmark.js --list
```

List the optional Superpowers integration suite:

```bash
node scripts/run-benchmark.js --cases benchmarks-optional/superpowers --list
```

Generate prompts for an external agent:

```bash
node scripts/run-benchmark.js --prompts
```

Score saved responses:

```bash
node scripts/run-benchmark.js --responses benchmark-responses.json --out benchmark-runs/my-run.json
```

Score integration responses with a separate host trace file:

```bash
node scripts/run-benchmark.js --responses benchmark-responses.json --traces host-traces.json --run-nonce adapter-run-20260722-001 --adapter-id codex-trace-adapter-v1 --adapter-version 1.0.0 --out benchmark-runs/my-integration-run.json
```

Run an agent command once per case:

```bash
node scripts/run-benchmark.js --command "your-agent-command"
```

The command receives the sanitized candidate prompt on stdin from an isolated temporary working directory. File arguments in `--command` that exist relative to the invocation directory are resolved to absolute paths before the candidate starts, so commands such as `node scripts/my-agent.js` keep working without changing the isolated candidate cwd. Response cases write natural text; route cases write the structured route JSON. Command mode does not install or prove a particular Skill bundle; comparable runs must bind the candidate model, harness version, sampling-config hash, and installed Skill-bundle hash. Use an external adapter for integration cases.

### Route Stability Sampling

Run only route cases five times each:

```bash
node scripts/run-benchmark.js --kind route --samples 5 --command "your-agent-command" --candidate-model "<model-id>" --harness-version "<harness-version>" --sampling-config-sha256 "<sha256>" --skill-bundle-sha256 "<sha256>" --out benchmark-runs/route-baseline.json
```

`--samples` is command-mode only, requires `--kind route`, and must be an integer greater than or equal to 3. Five samples are recommended for a baseline. Response and integration cases are not sampled because natural-language outputs do not have a canonical route signature and integration evidence must come from one bound adapter capture.

Each valid sample is normalized from:

- all five required `task_profile` fields;
- `route.primary` and `route.secondary`;
- the sorted, exhaustive top-level `advisory_components` array.

JSON field order, advisory order, and optional `confidence` do not change the signature. Invalid JSON, invalid contracts, and command errors remain in the report and count toward the sample denominator, but they cannot form a valid majority.

A signature must occur more than half of all samples:

- `pass`: the strict-majority signature matches the gold route;
- `fail`: a strict-majority signature exists but is wrong;
- `unstable`: no valid signature has a strict majority.

`summary.fail` includes both `fail` and `unstable`; `summary.unstable` exposes the unstable subset. The `sampling` report contains `samples_per_case`, average and minimum consensus, unstable case count, and invalid sample count. Each case retains raw `samples` and its `outcome_distribution`.

Comparable route baselines require identical contract, case set, Prompt set, candidate binding, command hash, kind filter, and sample count. The report stores only the command SHA-256, not the raw command.

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
4. Compare total score, per-skill score, pending human reviews, delta, and latest failures.

Each new report records `contract_version`, case-set and Prompt-set SHA-256 values, exact case order, a candidate-Prompt SHA-256 per case, and candidate/harness/sampling/Skill-bundle bindings. Dashboard deltas require a complete run with no `not_run` or pending review, plus identical contract, case set, Prompt set, candidate binding, command binding for command mode, kind filter, and samples-per-case. Partial coverage and mismatched sampling experiments are displayed but never compared.

The committed `benchmark-runs/example-2026-05-02.json` is synthetic sample data. Real local runs may include private prompts or outputs, so review them before committing.

## Current Scope

The benchmark remains intentionally lightweight:

- It validates case structure.
- It can generate fresh prompts.
- It can run a configurable command per case.
- It can repeat route-only command runs, aggregate normalized route signatures by strict majority, and report consistency separately from accuracy.
- It can score structured route output, natural responses, and adapter-captured integration envelopes.
- It records run metadata and can generate a Markdown dashboard for comparison across runs.

The `spontaneity/` directory contains paired evidence. Route cases check whether the framework avoids skill overuse in casual chat, play, exploratory thoughts, meta conversation, and explicit user opt-out requests. Matching response cases use count checks plus `human_rubric` to protect natural, non-template conversation when no domain skill is needed.

It does not yet provide a model-as-judge. That should come after the case library is stable.

The runner also does not yet import completed human-review verdicts. A case with `human_rubric` remains `needs_review`; do not edit a report by hand to manufacture a completed baseline. A future evaluator-owned review artifact must bind the case, Prompt, response, rubric, reviewer/Judge version, verdict, and reasons.

Therefore the current milestone establishes a schema and case-contract baseline. It does not yet establish a comparable response-quality score: all semantic response cases remain pending until the review-artifact path exists.

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
