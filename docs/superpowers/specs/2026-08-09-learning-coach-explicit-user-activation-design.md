# Learning Coach Explicit User Activation Design

**Status:** Superseded before implementation by `2026-08-09-declarative-activation-policy-design.md`
**Date:** 2026-08-09
**Primary target:** Codex with GPT-5.6 Sol at `xhigh`, using host-native reasoning by default

## Decision

`learning-coach` becomes a current-request explicit-user-only Skill.

Ordinary requests to explain a concept, compare ideas, build intuition, review an explanation, or create a study plan use the host-native route unless the current user request directly invokes `learning-coach`.

This change optimizes for predictable native-first behavior. Its main expected benefit is reduced workflow shaping, not large token savings, because `learning-coach` already activates infrequently in observed use.

## Goals

1. Keep `learning-coach` discoverable and enabled.
2. Prevent automatic primary or secondary selection.
3. Authorize it only from a valid invocation in the current user request.
4. Keep ordinary learning and explanation requests useful through host-native capabilities.
5. Reuse one canonical explicit-invocation contract for both `learning-coach` and `technical-deep-dive`.
6. Preserve all other Auto Skills and their current routing behavior.

## Non-Goals

- Do not disable or remove `learning-coach`.
- Do not add Hooks, model-tier configuration, or a second classifier call.
- Do not make other Thinking Skills explicit-only.
- Do not claim repository tests prove actual Codex Skill loading.
- Do not redesign `learning-coach` teaching methods after valid activation.

## Activation Contract

`learning-coach` is validly invoked only when the current user request:

- directly invokes `$thinking-skills:learning-coach` at the host invocation position; or
- combines a direct invocation command with the exact canonical name `learning-coach`, including supported ordinary quote wrappers.

Examples that activate:

- `Please use learning-coach to help me understand attention.`
- `请调用 learning-coach 帮我建立 Kafka 心智模型。`
- `$thinking-skills:learning-coach Create a small study plan for system design.`

The following do not activate it:

- ordinary learning intent, including `explain`, `help me understand`, `I do not understand`, or `make a study plan`;
- requests for a better, simpler, deeper, or more systematic explanation;
- mere mention, evaluation, modification, testing, quotation, example data, or reported speech;
- fuzzy names such as `learning mode`, `learning coach mode`, or `study coach`;
- selection or handoff by the Router, runtime, agent, or another Skill;
- invocation in a prior user request.

Authorization lasts for the current user request only. If the Skill is unavailable or disabled, report that it cannot be loaded and do not bypass the host by reading its known path.

## Shared Invocation Predicate

The benchmark runner currently has a centralized predicate specialized for `technical-deep-dive`. The implementation will generalize it to accept an exact canonical Skill identifier while preserving all existing boundary behavior:

- current final turn must be a user turn;
- host-token position is checked against raw input;
- code, quotes, blockquotes, examples, sample/test/data blocks, negation, questions, meta-review, and reported commands remain non-activating;
- direct imperatives and supported canonical-name wrappers remain activating;
- long-input scanning remains bounded.

Both explicit-only Skills must use this shared predicate in route-gold validation and tests. No duplicated parser is introduced.

## Routing Behavior

The Router retains three primary route families: Domain Skill, `native`, and `no-skill`.

| Request | Primary | Secondary |
|---|---|---|
| `Explain Kafka like I am new to distributed systems.` | `native` | none |
| `I still do not understand attention.` | `native` | none |
| `Create a system-design study plan.` | `native` | none |
| `Please use learning-coach to explain attention.` | `learning-coach` | none |
| Article-writing request with learning context, without invocation | `content-creator` | none |
| Distress about not understanding something, without invocation | `emotional-support` | none |
| Another deliverable plus valid `learning-coach` invocation | Deliverable-owning Skill | `learning-coach` when useful |
| Discussion or evaluation of `learning-coach` | `skill-evaluator` | none |

`learning-coach` is never selected or announced without valid current-request activation. Ordinary learning requests routed to `native` do not announce a Skill.

## Skill Self-Guard

`skills/learning-coach/SKILL.md` will enforce the same boundary in both frontmatter and body:

- validate activation before following teaching instructions;
- allow the file to be read as data for review or maintenance without activation;
- return control to the host-native route when activation is absent;
- preserve the existing teaching modes after valid activation.

## Eval and Benchmark Migration

Existing learning response cases that test the Skill's teaching behavior will add explicit invocation to their prompts.

Existing route cases without explicit invocation will migrate to `native`, including technical learning, concept explanation, and study-plan cases. Mixed writing or emotional cases will remove automatic `learning-coach` secondary selection.

New route coverage will include:

- English, Chinese, and host-token explicit positives;
- ordinary explanation, confusion, study-plan, and technical-learning native negatives;
- mention, evaluation, fuzzy alias, quoted/example, and reported-command negatives;
- prior-turn invocation not carried forward;
- explicitly requested secondary ownership in a mixed deliverable.

Static invariants will require every route or response gold that names `learning-coach` to contain a valid current-request invocation, except tests specifically reading the Skill as data.

## Documentation

Update the English and Chinese README activation tables from `Auto` to `Explicit only`. Update routing, architecture, eval, benchmark, and platform text wherever it describes automatic learning activation.

Planned and historical documents remain historical unless they claim to describe the current contract.

## Acceptance Criteria

1. `learning-coach` remains discoverable and enabled.
2. Ordinary explanation and learning requests route to `native` with zero Domain Skill selection/loading expected by integration scoring.
3. Valid current-request invocation routes to `learning-coach`.
4. Prior-turn invocation, mentions, evaluation, examples, quotes, negation, and reported speech do not activate it.
5. Mixed requests do not add `learning-coach` automatically.
6. `technical-deep-dive` explicit activation behavior remains unchanged.
7. All core tests, benchmark loaders, Skill validators, and documentation checks pass.
8. Trusted live host selection/loading remains explicitly `UNVERIFIED` until a host trace adapter exists.

## Rollback

Rollback is a normal repository revert: restore `learning-coach` Auto metadata and Router mappings, then restore the corresponding route and response golds. No host configuration migration is required.
