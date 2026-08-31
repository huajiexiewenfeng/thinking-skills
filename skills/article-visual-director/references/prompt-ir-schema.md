# Prompt IR Schema

Prompt IR is the model-neutral, auditable input to an image-model adapter. It is compiled from article semantics, one registered Style Pack, one asset role, same-role golden references, an approved article anchor when required, and a platform profile.

## Required Fields

- `profile_id`
- `style_pack_version`
- `asset_role`
- `objective`
- `output_contract`
- `semantics`
- `role_composition`
- `visual_dna`
- `reference_contract`
- `text_policy`
- `negative_constraints`
- `acceptance_checks`

`semantics` contains `confirmed`, `simplifications`, and `blocked`. A diagram additionally contains a validated `frozen_graph`. Adapters may rephrase this structure but may not add facts.

`output_contract.model_policy` records model selection when a profile constrains it. For `dense-technical-infographic`, it is exactly `{"alias":"gpt-image-2","selection":"latest-alias","runtime_identity":"record-if-returned"}`. The runtime-reported identity is recorded when available; no snapshot identifier is invented.

## Required Prompt Blocks

Every rendered image prompt contains these blocks exactly once and in this order:

1. `OUTPUT CONTRACT`
2. `ARTICLE SEMANTICS`
3. `ROLE COMPOSITION`
4. `VISUAL DNA`
5. `REFERENCE CONTRACT`
6. `TEXT POLICY`
7. `NEGATIVE CONSTRAINTS`
8. `ACCEPTANCE CHECK`

## Reference Contract

The default permanent reference is the same-role golden asset. An approved article anchor is added when the article workflow requires it. Cross-role references are not included by default and require a recorded reason.

`reference_contract` contains:

- `required_references`
- `must_preserve`
- `may_vary`
- `must_not_copy`

The compiler merges, but never weakens, the selected golden reference matrix. Golden labels, numbers, nodes, topology, and example story remain blocked.

### Candidate Golden Bootstrap

Formal article production always requires the permanent same-role golden. A profile whose registry entry has `style_pack_status: candidate` may compile its own golden candidates through `golden_production` without pretending that a permanent golden already exists.

- The first cover candidate uses no image reference and derives identity from Visual DNA plus the cover role contract.
- A concept or diagram candidate uses exactly one previously approved candidate from the same profile as a temporary reference.
- Every temporary reference is rendered with `bootstrap_reference: true`, `approval: approved`, and `semantic_authority: false`.
- Bootstrap never accepts a cross-profile reference, article anchor, permanent `golden_reference_ids`, or example content as semantic evidence.
- After three permanent role goldens are approved, normal same-role reference rules replace bootstrap.

## Native Copy Exception

Deterministic typography remains the default for exact text in every profile. Only `dense-technical-infographic` may use `text_policy.mode=native-generated-copy-with-validation`. Its `text_policy.exact_text` array is the complete copy ledger, `copy_ledger_status` is `frozen`, `native_text_generation` is `true`, `post_generation_validation` is `exact`, `deterministic_overlay` is `false`, and `fallback_policy` is `correct-one-isolated-copy-defect-otherwise-regenerate`.

The exception does not relax diagram semantics: a diagram still requires a valid `semantics.frozen_graph`. A text or semantic mismatch fails validation and is corrected, regenerated, or deterministically rebuilt; wrong native copy is never accepted.

## Lint Rules

Generation stops when any required block or field is missing; profile or role identity conflicts; the same-role golden reference is absent outside an explicit candidate bootstrap; inheritance constraints are vague; a diagram lacks a frozen graph; exact title text is incorrectly delegated to image generation outside the registered Style 9 exception; a publication theme mutates Visual DNA; platform aspect ratio, occupancy, or crop rules are missing; or an undeclared cross-profile/cross-role reference appears.

Lint failures use the shared drift codes and never fall back to a free-form prompt.
