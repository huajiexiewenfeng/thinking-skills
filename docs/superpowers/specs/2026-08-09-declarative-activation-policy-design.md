# Declarative Thinking Skills Activation Policy Design

**Status:** Draft for user review
**Date:** 2026-08-09
**Primary target:** Thinking Skills on Codex with GPT-5.6 Sol at `xhigh`

## Decision

Activation mode is a framework-level concern, not a behavior that maintainers should hand-code separately into every Skill.

Thinking Skills will add one versioned repository configuration as the source of truth:

```text
thinking-skills/
  config/
    activation-policy.yaml
```

Maintainers change a Skill between `auto`, `explicit`, and `disabled` by editing this file. A deterministic synchronizer generates or validates the platform-facing activation surfaces. No per-request Hook, second classifier call, or per-user configuration screen is added.

The previously approved `technical-deep-dive` explicit-user behavior is preserved but migrated under this policy. The proposed `learning-coach` change becomes a configuration entry rather than a second hand-written activation implementation.

## Problem

The current `technical-deep-dive` implementation distributes one activation decision across:

- Skill frontmatter and body guards;
- `thinking-router` rules, tables, examples, and announcements;
- Cursor and OpenCode bootstraps;
- direct handoff text in other Skills;
- benchmarks, evals, and public documentation.

That was useful as an MVP because it proved the behavior, but it scales poorly. Repeating the same edits for `learning-coach` would create multiple policy copies, inconsistent semantics, and expensive reviews.

The desired authoring model is:

```yaml
skills:
  learning-coach:
    mode: explicit
```

Everything else should be deterministic derivation or contract validation.

## Goals

1. Make `config/activation-policy.yaml` the sole manually authored activation-mode source.
2. Support `auto`, `explicit`, and `disabled` consistently.
3. Preserve each Skill's authored domain methods and non-activation content.
4. Generate the minimum host- and platform-facing policy text required by current discovery systems.
5. Detect stale Router, platform, benchmark, eval, and README policy through `--check`.
6. Keep the default shipped policy optimized for the owner's GPT-5.6 Sol `xhigh` workflow without asking users to choose modes.
7. Avoid any code that runs on every user request.

## Non-Goals

- No model-slug, reasoning-effort, owner, or deployment-channel profile selection in version 1.
- No personal override file or UI.
- No runtime Hook or background service.
- No dynamic mode change inside an active conversation.
- No automatic rewriting of human-authored teaching, writing, emotional, visual, or evaluation methods.
- No claim that repository tests prove real Codex Skill selection or loading.

## Canonical Configuration

Initial configuration:

```yaml
schema_version: 1
default_mode: auto

skills:
  thinking-router:
    mode: auto
    auto_description: Use when a user request needs intent classification.
  content-creator:
    mode: auto
    auto_description: Use when the user is developing public-facing content.
  article-visual-director:
    mode: auto
    auto_description: Use when an existing article needs a coherent visual system.
  technical-deep-dive:
    mode: explicit
    auto_description: Use when the user needs structured technical analysis.
  learning-coach:
    mode: explicit
    auto_description: Use when the user wants to build usable understanding.
  emotional-support:
    mode: auto
    auto_description: Use when the user expresses distress or emotional pain.
  conversation-review:
    mode: auto
    auto_description: Use when the user asks to review a conversation or Skill trace.
  skill-evaluator:
    mode: auto
    auto_description: Use when reviewing a Skill failure, regression, or golden case.
  benchmark-assistant:
    mode: auto
    auto_description: Use when the user wants to run or interpret benchmarks.
```

The examples above abbreviate the existing descriptions for readability. The committed manifest stores each complete current Auto discovery description byte-for-byte.

Every first-party Skill directory must appear exactly once and provide `mode` plus `auto_description`. Missing Skills, unknown Skills, duplicate keys, blank descriptions, unknown modes, or unsupported schema versions fail validation. `default_mode` is used only when scaffolding a newly registered Skill; released first-party Skills remain explicit entries so the public state is reviewable.

## Mode Semantics

### `auto`

- The Skill is discoverable and enabled.
- Its normal authored trigger description is eligible for host intent matching.
- The Router may select it as primary or secondary under its domain rules.

### `explicit`

- The Skill remains discoverable and enabled.
- It may be selected only when the current user request validly invokes its exact canonical identifier.
- Ordinary domain intent routes to `native` unless another Auto Skill owns the deliverable.
- Router, runtime, agent, another Skill, and prior-turn handoffs do not authorize it.
- It may be secondary only after valid current-request invocation.

### `disabled`

- The Skill remains in repository source but is excluded from effective platform discovery or marked disabled by the platform's static per-Skill mechanism.
- The Router must not select, announce, or hand off to it.
- Explicit invocation reports that the Skill is unavailable; it must not fall back while claiming the Skill ran.
- A deployment is invalid if its adapter cannot enforce disabled discovery/selection.

`disabled` is stronger than `explicit`. A self-guard alone is not sufficient evidence of disabled state.

## Explicit Invocation Contract

All `explicit` Skills share one canonical contract and parser, parameterized by exact Skill identifier.

Valid activation requires the current final user request to:

- invoke `$thinking-skills:<canonical-skill-name>` at the host invocation position; or
- combine a direct invocation command with the exact canonical Skill name, including supported ordinary name wrappers.

The following remain non-activating:

- ordinary domain intent or requests for deeper, simpler, or systematic work;
- mention, evaluation, configuration, modification, disabling, or testing;
- quoted commands, code, blockquotes, examples, fixtures, sample/test/data blocks, and reported speech;
- negation, questions about whether to use the Skill, and fuzzy aliases;
- prior-turn invocation or component-generated handoff.

The existing bounded `technical-deep-dive` predicate will be generalized rather than copied. Its regression suite becomes a shared explicit-activation contract suite and runs for every Skill configured as `explicit`.

## Architecture

```text
config/activation-policy.yaml
            |
            v
scripts/sync-activation-policy.js
     |            |             |
     v            v             v
Skill guards   Router/platform  Docs + contract checks
and metadata   policy blocks    for evals/benchmarks
            |
            v
platform install/package adapters
```

### Policy loader

A small module parses and validates the manifest. It exposes normalized Skill entries and mode queries. Other repository tooling imports this module instead of re-parsing YAML or hard-coding mode lists.

### Synchronizer

`node scripts/sync-activation-policy.js` performs deterministic repository synchronization.

`node scripts/sync-activation-policy.js --check` performs the same computation in memory and fails if checked-in derived surfaces are stale. `--check` never writes files.

The synchronizer owns only marked generated regions. It must not rewrite human-authored method content outside those regions.

### Generated or validated surfaces

The policy controls:

1. standardized activation metadata and self-guard blocks in first-party `SKILL.md` files;
2. the Router's mode table, explicit-only guards, disabled exclusions, and mode-sensitive examples;
3. Cursor and OpenCode policy bootstrap sections;
4. English and Chinese README activation tables;
5. platform discovery/package manifests for disabled Skills;
6. activation-specific benchmark fixtures and invariants.

Human-authored domain evals and response rubrics are not blindly generated. Instead, the synchronizer validates that a gold selecting an `explicit` Skill has a valid current-request invocation and that a `disabled` Skill is never selected. Activation-specific route fixtures may be generated from generic mode templates.

## Skill Source Contract

Each Skill keeps its authored purpose, modes, processes, method bases, and safety guidance. Its complete authored Auto discovery description moves into the manifest as `auto_description`, next to its activation mode.

Generated activation regions use stable markers. For example:

```md
<!-- activation-policy:start -->
Generated. Edit config/activation-policy.yaml, not this block.
<!-- activation-policy:end -->
```

For an `explicit` Skill, the generated frontmatter description and body guard enforce current-request invocation before method instructions are followed. For an `auto` Skill, `auto_description` becomes the active frontmatter description and the generated block records Auto eligibility. For a `disabled` Skill, source remains reviewable but deployment adapters remove or statically disable its discovery entry.

The manifest is the only stored source of Auto discovery metadata. A round trip `auto -> explicit -> auto` must reproduce byte-equivalent frontmatter from `auto_description`.

## Router Semantics

The Router loads the generated mode table and applies these invariants:

- exactly one primary route: Auto Domain Skill, validly invoked Explicit Skill, `native`, or `no-skill`;
- at most one secondary Skill;
- an Explicit Skill cannot be selected or used as secondary without current-request invocation;
- a Disabled Skill cannot be selected under any request;
- ordinary intent for an Explicit or Disabled Skill goes to `native` unless another Auto Skill owns the deliverable;
- evaluation of a named Skill remains `skill-evaluator`, treating the named Skill as data unless the same request validly invokes it.

With the initial policy, ordinary technical and learning requests use `native`. `technical-deep-dive` and `learning-coach` run only after explicit invocation. Other first-party Skills retain Auto behavior.

## Platform Enforcement

The repository policy is authoritative, but current platforms consume different artifacts.

### Codex native Skills

- `auto` and `explicit` remain discoverable.
- Explicit enforcement uses generated metadata, self-guard, Router policy, and benchmark contracts.
- `disabled` uses Codex's documented static per-Skill enablement during installation/update.
- The repository synchronizer does not silently edit a user's global Codex configuration. A separate explicit install/apply command previews the target changes, creates a backup, and applies the generated per-Skill settings.

### Packaged plugins

Disabled Skills are omitted from generated package discovery. Auto and Explicit Skills retain their generated metadata.

### Cursor and OpenCode

Generated bootstrap policy excludes Disabled Skills and carries the shared Explicit contract. These adapters must not maintain independent handwritten mode lists.

If a target platform cannot enforce `disabled`, packaging or installation for that target fails with a clear unsupported-capability message.

## User Configuration and Updates

Version 1 has no user-facing per-Skill setup. The shipped repository policy is the default behavior.

Maintainer workflow:

```powershell
# edit one source
config/activation-policy.yaml

# synchronize derived repository surfaces
node scripts/sync-activation-policy.js

# verify no stale generated state
node scripts/sync-activation-policy.js --check
```

Installation/update tooling applies platform artifacts once. Nothing runs on each conversation turn.

## Benchmark and Eval Contract

The benchmark runner imports the normalized policy.

Required invariants:

- every selected `explicit` Skill has valid current-request invocation;
- an uninvoked domain request for an Explicit Skill expects `native` unless another Auto Skill owns the result;
- a Disabled Skill never appears as primary, secondary, advisory, selected, or loaded;
- `native` and `no-skill` continue to expect zero selected/loaded Domain Skills;
- every configured Explicit Skill receives the same positive, negative, quoted-data, reported-speech, prior-turn, and mixed-secondary activation matrix;
- changing one manifest entry produces deterministic fixture and documentation changes.

Route/list/prompt tests remain repository evidence. Actual Codex discovery, selection, loading, and cross-request unloading remain `UNVERIFIED` without trusted host traces.

## Error Handling

The policy tool fails closed on:

- invalid YAML or schema version;
- missing, duplicate, or unknown Skill entries;
- unsupported mode;
- stale or malformed generated markers;
- a derived file that would require editing outside an owned region;
- an Explicit gold without valid invocation;
- a Disabled Skill present in effective discovery output;
- platform adapters that cannot enforce the selected mode.

Write mode computes all outputs before applying any change. A failure must not leave partially synchronized repository files. Check mode is read-only.

## Migration

1. Add the manifest, schema validation, and read-only `--check` contract tests.
2. Generalize the explicit invocation predicate without changing current `technical-deep-dive` behavior.
3. Add generated activation regions and synchronize the existing technical policy.
4. Move Router, Cursor, OpenCode, README, and activation-fixture mode lists under the synchronizer.
5. Set `learning-coach: explicit` in the manifest and migrate its route/response evidence.
6. Add disabled-mode package and Codex install-adapter tests with no Skill disabled in the initial shipped policy unless explicitly approved later.
7. Run full repository verification and a fresh local Codex behavioral smoke test.

The migration must preserve a clean diff boundary between authored content and generated activation content. Existing `technical-deep-dive` behavior is the compatibility baseline.

## Acceptance Criteria

1. One manifest lists all first-party Skills and their modes.
2. Switching a Skill mode requires editing only the manifest before running the synchronizer.
3. `--check` detects any hand-edited or stale derived activation surface.
4. `technical-deep-dive` remains Explicit with all existing regressions green.
5. `learning-coach` becomes Explicit through configuration, not a copied implementation.
6. Every other current Skill remains Auto.
7. Disabled mode is proven through generated discovery/package output and Codex static-config adapter tests.
8. No Hook or per-turn activation process is introduced.
9. Full Node tests, benchmark inventories, Skill validators, platform syntax checks, and documentation checks pass.
10. Trusted live host trace remains clearly `UNVERIFIED` until a trace adapter exists.

## Rollback

Revert the manifest and rerun the synchronizer. Because generated surfaces are deterministic, rollback does not require manually restoring every Skill or platform file.

If the synchronizer itself must be rolled back, revert its implementation commit together with its generated artifacts. Installation adapters preserve backups before applying host configuration changes.
