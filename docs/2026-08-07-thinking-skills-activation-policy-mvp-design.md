# Thinking Skills Activation Policy MVP Design

**Status:** Superseded by `docs/superpowers/specs/2026-08-08-technical-deep-dive-explicit-user-activation-design.md`
**Date:** 2026-08-07
**Primary target:** Private owner-preview build on Codex using GPT-5.6 Sol

## Decision Summary

Thinking Skills will support two host-selected bundle modes:

- `selective`: native Codex behavior is the default. Codex sees compact Skill metadata and loads an individual Thinking Skill only when the user invokes it or its distinctive workflow matches the request.
- `full`: the existing Thinking Router remains the mandatory entry point and selects the primary domain Skill.

The Activation Policy that selects the bundle mode belongs to the Codex host/plugin layer. It is not a normal Skill and does not make a second LLM call.

The MVP is intentionally owner-first:

- A private `owner-preview` installation plus the active model slug `gpt-5.6-sol` resolves to `selective`.
- `gpt-5.4`, a non-owner installation, an unknown model, a Hook failure, or invalid policy state resolves to `full`.
- The owner-preview deployment assumes the owner's normal reasoning effort is high or higher. The documented Codex Hook schema exposes the active model slug but not the effective reasoning effort, so the MVP must not claim that it verifies the effort level.
- Normal users make no required configuration choice. A public build remains `full` until broader evaluation supports another default.

## Evidence and Problem Statement

Three C-drive diagnosis runs exposed two separate problems:

| Run | Mode | End-to-end time | Result |
|---|---|---:|---|
| A | Thinking Router plus `technical-deep-dive` | 14m36s | Correct, broad diagnosis |
| B | No Skill, targeted warm recheck | 1m31s | Same decision-level conclusion with lower cost |
| C | No Skill, fresh broad diagnosis | 9m59s | Equal or greater coverage than Run A |

The comparison supports two conclusions:

1. On the owner runtime, `technical-deep-dive` did not demonstrate distinct decision-quality value for a bounded, read-only storage diagnosis.
2. Disabling Skills alone does not guarantee speed. Run C still investigated for almost ten minutes, so execution scope and stopping budgets are a separate concern.

The existing overlap patch in `technical-deep-dive` reduces visible ceremony but cannot prevent capability-insensitive activation. The current Thinking Router is also described as the entry point for every request, so the model has no profile-aware way to choose native execution.

## Goals

1. Make `selective` automatic for the private owner-preview build when the active model is `gpt-5.6-sol`.
2. Preserve current full Thinking Skills behavior for GPT-5.4, public/non-owner installations, unknown models, and policy failures.
3. Add no additional model round trip.
4. Avoid reading the full Thinking Router or `technical-deep-dive` instructions for validated native cases.
5. Keep every individual Thinking Skill discoverable through Codex's native name-and-description matching.
6. Preserve explicit Skill invocation and all system, developer, safety, permission, and tool requirements.
7. Require no normal-user profile or Skill-strength selection.
8. Record compact mode-selection evidence for evaluation without storing raw prompts.

## Non-Goals

The MVP will not:

- provide a hard, per-request Skill-loading firewall;
- detect or verify effective reasoning effort;
- support every Agent platform;
- infer capability from arbitrary or unrecognized model names;
- dynamically promote profiles from live production behavior;
- enforce scan-depth or stopping budgets;
- replace platform safety gates or tool prerequisites;
- make user-facing responses announce policy internals;
- prove that every Thinking Skill is redundant on GPT-5.6 Sol.

The first evidence is strongest for routine technical reasoning. Other Thinking Skills remain natively discoverable, and false-suppression tests are required before any public selective rollout.

## Confirmed Codex Capabilities and Limits

The official Codex manual establishes the following implementation surface:

- Plugins may bundle lifecycle Hooks through `hooks/hooks.json` or a manifest `hooks` entry.
- `SessionStart` and `UserPromptSubmit` Hooks receive the active model slug in the common `model` field.
- These Hooks may return `additionalContext`, which Codex adds as developer context.
- `UserPromptSubmit` receives the current prompt, but the MVP does not persist or copy it into traces.
- Codex already uses progressive Skill disclosure: the model first sees Skill name and description, then reads the complete `SKILL.md` only after selecting that Skill.
- `skills.config` supports static per-Skill enablement, but it is not a documented per-request activation API.
- The documented Hook input does not include effective `model_reasoning_effort`.

Therefore the MVP is a **soft host policy**: the Hook deterministically selects and injects the bundle mode, while Codex's existing model call performs normal Skill matching from compact metadata. A future native hard-gating API may replace this adapter without changing the profile semantics.

Official source basis:

- Codex Hooks: `https://learn.chatgpt.com/docs/hooks`
- Codex Skill activation and progressive disclosure: `https://developers.openai.com/plugins/concepts/skills`
- Codex per-Skill configuration: `https://learn.chatgpt.com/docs/config-file/config-reference`

## Responsibility Boundary

```text
System, developer, safety, permission, and tool hard constraints
                              ↓
                    Explicit user intent
                              ↓
              Codex Activation Policy Hook
                              ↓
          Native Skill metadata matching or full Router
                              ↓
                   Selected domain Skill(s)
```

### Codex/plugin responsibilities

- Identify whether the installation is the private owner-preview channel.
- Read the active model slug supplied to the Hook.
- Resolve the bundle mode deterministically.
- Inject one compact developer-context directive at session start and whenever the effective mode changes.
- Store mode state and bounded trace data under `PLUGIN_DATA`.
- Default to `full` on missing, malformed, ambiguous, or conflicting state.

### Thinking Skills responsibilities

- Make `thinking-router` conditional on `full` or unspecified mode.
- Preserve current Router behavior when the mode is `full` or the Hook is unavailable.
- Keep domain Skill descriptions sufficient for Codex's native selective matching.
- Publish a versioned bundle manifest classifying generic overlap and distinctive workflows.
- Provide integration benchmarks for correct native execution and retained domain-Skill activation.

### Codex model responsibilities in `selective`

- Use native reasoning by default.
- Do not load `thinking-router` merely because a request exists.
- Load an individual Thinking Skill when the user explicitly invokes it or when its description identifies a distinctive workflow needed by the request.
- Avoid treating generic planning, evidence gathering, debugging, explanation, or verification as sufficient reasons to load a Thinking Skill.

## Deployment Binding and Runtime Input

The private MVP package contains a trusted deployment binding:

```yaml
schema_version: 1
deployment_channel: owner-preview
policy_enabled: true
```

The Hook combines this binding with its documented input:

```yaml
session_id: supplied-by-codex
model: supplied-by-codex
hook_event_name: SessionStart-or-UserPromptSubmit
```

The binding is part of the private package or install process, not a choice presented to the user. A public package uses `deployment_channel: public` and therefore remains `full`.

Model matching uses a versioned exact allowlist. Unrecognized aliases do not enter `selective` until added and tested.

## Profile Resolution

```text
if policy kill switch is active:
    full
else if deployment_channel != owner-preview:
    full
else if active model is exactly an approved GPT-5.6 Sol slug:
    selective
else:
    full
```

The initial allowlist contains only the exact active slug verified in the owner's Codex environment. GPT-5.4 and every unknown slug resolve to `full`.

The mode is recalculated on every `SessionStart` and `UserPromptSubmit` event. Each injected directive explicitly applies to the **next model request only**; earlier directives do not remain authoritative for later turns.

- Every `SessionStart` emits a one-request directive for `startup`, `resume`, `clear`, and `compact`.
- Every ordinary `UserPromptSubmit` emits a one-request directive using the current model field.
- When a `UserPromptSubmit` immediately follows a successful `SessionStart` directive for the same pending request and mode, the Hook may suppress the duplicate text while retaining the already-issued one-request directive.
- Policy-version and kill-switch values are read on every event.

This turn-scoped contract makes Hook failure conservative: if a later event emits no fresh directive, the Router treats the mode as unspecified and therefore `full`.

## Bundle Modes

### `selective`

The injected directive communicates:

```text
For the next model request, Thinking Skills mode is selective unless the user
explicitly requests full mode or thinking-router. Otherwise skip
thinking-router, use native Codex by default, and load an individual Thinking
Skill only for an explicit invocation or distinctive workflow match.
```

Codex then uses its existing Skill metadata matching inside the normal model call. There is no separate classifier call and no second Router.

### `full`

The injected directive communicates that normal Thinking Router behavior applies. If no valid Hook directive exists, `thinking-router` also defaults to `full` for backward compatibility.

### Explicit user intent

- Naming an individual Thinking Skill keeps that Skill eligible in either mode.
- An explicit advisory opt-out applies to the current turn.
- An explicit `full` request or named `thinking-router` invocation applies to the current turn and overrides the selective directive.
- Quoted text, examples, or discussion of a mode string are not treated as overrides.
- No advisory override can disable system, safety, permission, or tool requirements.

The Hook does not parse arbitrary user prose to enforce these overrides. The model applies explicit intent under the injected developer contract during the existing model call.
Turn-level user intent does not change the Hook's stored profile mode and is evaluated separately in integration tests.

## Router Compatibility Contract

The `thinking-router` trigger must be revised to mean:

```text
Use at the start of a request when Thinking Skills mode is full or unspecified,
or when the user explicitly requests full mode or names thinking-router. Do not
otherwise invoke in selective or off mode.
```

This single default preserves existing behavior when the Hook is missing, disabled, untrusted, or broken. It also prevents the current unconditional Router description from conflicting with selective mode.

## Bundle Manifest

The MVP uses one versioned manifest rather than adding a new file to every Skill:

```yaml
schema_version: 1
bundle: thinking-skills
skills:
  technical-deep-dive:
    activation_class: advisory
    generic_overlap:
      - evidence_collection
      - hypothesis_testing
      - verification_planning
    distinctive_workflows:
      - architecture_tradeoff_artifact
      - staged_migration_analysis
      - performance_investigation_design
```

The manifest supports evaluation and generation of the compact policy directive. It is not loaded wholesale into every prompt. Duplicate Skill IDs, unknown activation classes, schema mismatches, or missing required fields invalidate the manifest and force `full`.

## Hook Components and Data Flow

The private plugin adds:

```text
hooks/hooks.json
hooks/resolve_activation_mode.py
policy/activation-policy.yaml
policy/thinking-skills-manifest.yaml
```

Data flow:

```text
SessionStart/UserPromptSubmit event
        ↓
Read deployment binding and active model
        ↓
Validate policy and manifest versions
        ↓
Resolve selective or full
        ↓
Issue a one-request compact additionalContext directive
        ↓
Write bounded trace event
```

Plugin Hooks require the user to review and trust their definition when the plugin is first enabled. This is a one-time platform security step, not an ongoing mode-selection workflow.

## Token and Latency Budget

The MVP must meet these constraints:

- No additional model request for activation.
- No LLM-based pre-classifier.
- Profile resolution is local deterministic Hook code.
- Each model request receives at most one effective mode directive, including requests resumed after compaction.
- The directive is capped at 80 input tokens and measured as separate activation overhead.
- Selective native cases do not read the full Router or `technical-deep-dive` instructions.

Codex's normal initial Skill name-and-description list remains present; the MVP does not claim to remove that baseline metadata cost. Savings come from avoiding the complete Router and domain-Skill instructions, repeated workflow narration, and behavior caused by unnecessary activation.

If measured owner-profile input tokens are not lower than current full routing on the paired benchmark set, the MVP fails acceptance.

## Trace Contract

The Hook records mode selection, not a claim that it mechanically blocked or observed every Skill load:

```json
{
  "event_id": "generated-opaque-id",
  "session_id_hash": "non-reversible-session-hash",
  "model": "gpt-5.6-sol",
  "deployment_channel": "owner-preview",
  "profile_mode": "selective",
  "directive_emitted": true,
  "reason_codes": ["OWNER_PREVIEW", "MODEL_ALLOWLIST_MATCH"],
  "policy_version": 1,
  "scope_budget": null
}
```

Trace files live under `PLUGIN_DATA`, retain at most 1,000 events or 30 days—whichever is smaller—and never store raw prompts, file contents, credentials, or conversation transcripts. Trace-write failure does not block the user turn; it emits a local diagnostic and leaves the resolved mode unchanged.

Actual Skill reads are measured by the integration benchmark adapter rather than inferred from this trace.

## Skill-Load Observability

The existing benchmark contract requires host-captured `discovered → selected → loaded` events. The Activation Hook alone cannot observe native Skill loading, so the MVP adds a test-only `codex-activation-trace-adapter`:

1. For each integration run, the adapter creates instrumented copies of the candidate Skills in an isolated temporary Skill root.
2. Each copied full `SKILL.md` contains a per-run unpredictable nonce and a first-step instruction to call the benchmark-only `record_skill_load` tool with its Skill ID and nonce.
3. The compact Skill name and description do not contain the nonce.
4. The adapter records `discovered` when it publishes the temporary catalog and records `selected` plus `loaded` only after the tool presents a valid nonce.
5. The natural response and trace are bound using the existing run nonce and hashes defined in `docs/benchmark.md`.

Because the model cannot know the nonce from compact metadata, a valid probe is evidence that the full instrumented instructions were available. Missing, malformed, or unbound probe evidence makes the integration case inconclusive or failed; it is never interpreted as proof of non-loading.

Production Skill files do not contain probes, and the benchmark tool is unavailable outside the isolated integration fixture.

## Failure and Rollback Behavior

- Missing or malformed deployment binding: `full`.
- Missing, unknown, or malformed model slug: `full`.
- Invalid, duplicate, stale, or conflicting manifest/policy data: `full`.
- Hook execution failure or untrusted Hook: no fresh one-request directive; Router's unspecified-mode default is `full`.
- State-file corruption: discard state, recompute mode, and default to `full` if recomputation fails.
- Mid-session model change: recompute on the next `UserPromptSubmit` and inject the new mode when changed.
- Domain Skill unavailable or its full instructions fail to load: report the load failure and continue natively when safe; do not silently claim the Skill ran.
- Emergency rollback: a local kill switch forces `full` on the next Hook event.

Because `UserPromptSubmit` checks the policy version and kill switch every turn, rollback does not rely on ending existing sessions.

## Evaluation Design

The MVP uses paired integration fixtures under identical task state:

1. Owner-preview plus approved GPT-5.6 Sol slug, bounded C-drive diagnosis: selective directive, no Router or `technical-deep-dive` read, correct and safe result.
2. The same profile, targeted warm recheck: native execution and lower cost than broad discovery.
3. GPT-5.4 on the same prompt: `full` and current Router behavior.
4. Public/non-owner deployment on GPT-5.6 Sol: `full`.
5. Unknown and aliased model slugs: `full` until explicitly allowlisted.
6. Missing/untrusted Hook, including failure immediately after a successful selective turn: the next request falls back to `full`.
7. Mid-session model change between approved GPT-5.6 Sol and GPT-5.4: mode changes before the next prompt.
8. Explicit named Skill invocation in selective mode: the named Skill remains eligible.
9. Quoted or example text containing `skills=full` or `skills=off`: no override.
10. Malformed, duplicate, or conflicting manifest data: `full`.
11. Trace sink failure: task continues and mode remains correct.
12. Kill-switch activation in an existing session: next turn receives `full`.
13. Explicit full-mode or named-Router request during selective mode: Router loads for that turn.

False-suppression cases cover every Thinking Skills domain before public rollout:

- content creation;
- learning;
- emotional support, including safety-sensitive distress;
- conversation review;
- Skill evaluation;
- benchmark operation;
- article visual direction;
- a validated distinctive `technical-deep-dive` workflow.

Each paired case records:

- task quality and safety rubric results;
- end-to-end latency;
- input and output tokens;
- full Skill documents read;
- tool-call count;
- repeated workflow narration;
- resolved profile and reason codes.

The C-drive test uses a stable synthetic inventory or captured read-only fixture. Sequential timing on a changing live filesystem is supporting evidence, not a regression benchmark.

## Stage-0 Feasibility Gate

Before behavior changes, a local smoke test must verify the installed Codex surface actually:

1. loads a trusted plugin Hook;
2. fires `SessionStart` and `UserPromptSubmit`;
3. supplies the active `model` field;
4. adds Hook `additionalContext` as developer context;
5. preserves that context across the normal turn;
6. reruns correctly after resume and compaction;
7. exposes `PLUGIN_DATA` for bounded state and traces.
8. runs the isolated nonce-bound `record_skill_load` probe and produces a host-bound integration trace.

If any required capability is absent in the installed Codex version, implementation stops and reports the exact missing capability. It must not replace the design with an always-on Activation Skill.

## Acceptance Criteria

The MVP is accepted when:

1. The Stage-0 Hook smoke test passes on the owner's installed Codex build.
2. The private owner-preview build plus the approved GPT-5.6 Sol slug resolves to `selective` without a user choice.
3. GPT-5.4, public/non-owner, unknown, malformed, and failure fixtures resolve to `full`.
4. A bounded C-drive fixture does not read `thinking-router` or `technical-deep-dive` in selective mode.
5. Explicit individual Skill invocation continues to work.
6. Domain false-suppression fixtures retain their expected Skills and safety behavior.
7. Activation adds no model request, and its one-request directive stays within the 80-token cap.
8. Owner-profile paired cases consume fewer total input tokens than current full routing.
9. A mid-session model or kill-switch change updates the mode on the next prompt.
10. Existing full-mode routing and response benchmarks remain green.

## Rollout

1. Run the Stage-0 Hook smoke test without changing Thinking Skills behavior.
2. Add the Hook, private deployment binding, schemas, manifest, state, and trace tests with the kill switch forced to `full`.
3. Add Router compatibility and paired integration benchmarks.
4. Enable `selective` only in the private owner-preview package.
5. Review false suppression and token deltas before any wider profile is considered.

Rollback sets the kill switch to `full`; the next `UserPromptSubmit` updates active sessions.

## Deferred Work

After the MVP is stable, separate designs may add:

- verified reasoning-effort input if Codex exposes it to Hooks;
- native hard Skill gating;
- execution-scope and stopping budgets;
- additional model and harness profiles;
- controlled profile promotion;
- OpenCode, Cursor, Claude Code, and other adapters;
- a user-facing expert trace view.
