# GPT Image Adapter

Use this adapter only after a valid Prompt IR exists. It translates model-neutral facts into a GPT Image prompt without adding article facts or weakening the selected Style Pack.

## Execution Mode

The default adapter path is the Codex built-in `image_gen` capability. Record `mode: built-in-image-gen`, `model_selection: host-managed`, `api_key_required: false`, and `fallback_approval: not-required`. When the built-in schema exposes no model parameter, call it without one; do not switch runtimes to force a model alias. Built-in execution never needs `OPENAI_API_KEY`.

The CLI/API path is a fallback, not a model-selection convenience. Use it only after the user explicitly requests or approves fallback, then record `mode: cli-api-fallback`, `model_selection: gpt-image-2`, `api_key_required: true`, and `fallback_approval: explicit-user-approved`. If built-in generation fails or is unavailable, explain the fallback and stop for approval before any CLI/API call. Record the exact runtime identity returned by the host when available; record `null` when none is returned and never invent an identity.

## Reference Selection

Attach the permanent same-role golden image by default. Attach the approved article anchor when required by the article workflow. A cross-role reference is exceptional and must have a recorded property-specific reason.

For every attached reference, render its `must_preserve`, `may_vary`, and `must_not_copy` rules explicitly. State that visible example content is non-authoritative.

During candidate golden production only, the first cover may have no image reference. A later same-profile bootstrap candidate may be attached only when its record says `approval: approved`, `bootstrap_reference: true`, and `semantic_authority: false`. Treat it as temporary visual evidence, never as article facts. Never use another profile's golden or candidate to start a mode.

## Block Rendering

Render the eight Prompt IR blocks in their declared order. Use concrete, observable language for composition, palette roles, material, line behavior, geometry, spacing, camera, and forbidden traits. Keep article semantics separate from visual instructions.

`OUTPUT CONTRACT` states role, aspect ratio, target platform, occupancy, crop survival, and output count.

`ARTICLE SEMANTICS` contains only confirmed facts and declared simplifications. Blocked claims stay explicit.

`ROLE COMPOSITION` uses family stability for cover/concept and strict stability for diagram.

`VISUAL DNA` serializes the selected profile invariants without publication-theme mutation.

`REFERENCE CONTRACT` names each reference and its inheritance rules.

`TEXT POLICY` delegates exact titles and dense technical labels to deterministic typography by default. Only `dense-technical-infographic` may use `native-generated-copy-with-validation`, with a frozen exact-copy ledger, exact post-generation review, and fallback `correct-one-isolated-copy-defect-otherwise-regenerate`. Diagrams still include and obey the frozen graph.

`NEGATIVE CONSTRAINTS` combines profile, role, semantic, and common generation exclusions without introducing another style.

`ACCEPTANCE CHECK` restates the observable conditions used during post-generation review.

## Failure Boundary

Do not call an image runtime if lint reports an error. Do not recover by removing a golden reference, blending profiles, rewriting the prompt freely, copying example topology, accepting wrong text, or silently switching from built-in execution to CLI/API fallback. Correct only the failed Prompt IR or Style Pack field, then compile again.
