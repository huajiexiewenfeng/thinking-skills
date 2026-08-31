# GPT Image Adapter

Use this adapter only after a valid Prompt IR exists. It translates model-neutral facts into a GPT Image prompt without adding article facts or weakening the selected Style Pack.

## Model Selection

For `dense-technical-infographic`, select the latest alias `gpt-image-2` through `selection: latest-alias` and record any runtime-reported identity. Do not substitute `chatgpt-image-latest`, pin an older snapshot, or invent a model identity when the host abstracts selection.

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

Do not call GPT Image if lint reports an error. Do not recover by removing a golden reference, blending profiles, rewriting the prompt freely, copying example topology, or accepting wrong text. Correct only the failed Prompt IR or Style Pack field, then compile again.
