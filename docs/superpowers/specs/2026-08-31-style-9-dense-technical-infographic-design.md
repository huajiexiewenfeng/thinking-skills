# Style 9 Dense Technical Infographic Design

## Status

Approved in conversation for specification. Implementation remains gated on final review of this written design.

## Objective

Add a ninth `article-visual-director` mode named **Dense Technical Infographic（高密度技术信息图）**. The mode turns verified technical content into a content-rich, text-bearing engineering explainer poster generated primarily with the latest GPT Image model alias, while preserving the Skill's requirements for article-specific semantics, explicit user approval, golden-reference non-authority, and fail-closed validation.

The new mode is intended for framework internals, middleware, network protocols, concurrency models, performance mechanisms, architecture tutorials, and other topics that benefit from dense labels, arrows, numbered sections, and a visible takeaway band.

## Identity and Registry

- Ordinal: `9`
- Profile ID: `dense-technical-infographic`
- English name: `Dense Technical Infographic`
- Chinese name: `高密度技术信息图`
- Protocol version: `2`
- Style Pack version: `3`
- Initial status: `candidate`
- Adapter: `gpt-image`

The mode remains a candidate until three new golden assets are explicitly approved, all contract hashes match, three cross-topic probes pass, neighbor discrimination passes, and the release validator succeeds.

## Boundary From Existing Modes

Style 9 must read as a high-density engineering teaching poster, not a product-launch visual.

- Style 4 uses a cool-white grid, polished glass-acrylic product depth for covers and concepts, and deterministic typography for strict diagrams. Style 9 is flat, text-forward, denser, and poster-like across all three roles.
- Style 8 uses warm paper, lively handwritten lines, pastel marker fills, formulas, and optional miniature narrators. Style 9 uses precise vector-like geometry, clean sans-serif typography, crisp icons, and no people.
- Style 1 is sparse technical editorial illustration. Style 9 uses much higher information density, numbered zones, embedded explanations, and a bottom takeaway rail.
- Style 5 is a fixed-isometric matte world. Style 9 is front-facing and flat, with no architectural depth or isometric camera.

## Visual DNA

### Surface

- Fully opaque pure white or slightly cool-white background.
- No blueprint grid, warm paper texture, dark canvas, transparent background, or ornamental scene.
- Subtle pale-blue section fills are allowed only to separate information zones.

### Hierarchy

- One oversized deep-navy title spans the upper band.
- One central mechanism or architecture is the visual nucleus.
- Three to six numbered explanatory zones support the nucleus.
- A full-width bottom takeaway rail summarizes benefits, principles, or constraints.
- Total intentional occupancy is approximately 85% to 92% of the canvas.
- Reading order must remain obvious despite the density.

### Geometry

- Flat vector-like icons and modules.
- Rounded rectangular group boundaries, restrained dashed boundaries, number discs, direct arrows, small caption blocks, and compact bullet lists.
- Light gradients and minimal soft shadows may separate cards, but no glass, acrylic, chrome, 3D, isometric projection, or floating UI scene is allowed.

### Semantic Palette

- Deep navy: page title and highest information hierarchy.
- Royal blue: primary structure, normal nodes, main process, and ordinary links.
- Engineering green: successful path, effective output, verified benefit, or supported optimization.
- Orange: conclusions, high-value reminders, shared principles, or explicit attention points.
- Purple: configuration, modularity, or extension capability only when supported by the article.
- Red: failure, danger, invalid state, or blocked route only when supported by the article.
- Neutral gray: secondary explanatory copy and non-semantic separators.

Color never creates an unsupported state. Every non-neutral semantic color must map to an article-confirmed meaning.

### Typography

- Large Chinese and mixed Chinese-English titles are first-class visual elements.
- Short section titles, node labels, brief explanations, numbered steps, and takeaway copy may be generated natively by GPT Image 2.
- Copy must use a clean, technical sans-serif appearance rather than handwriting, decorative display fonts, or pseudo-code texture.
- Correct native text is preserved. Incorrect text is corrected or regenerated; it is never silently accepted.

### Forbidden Traits

- No decorative AI brain, humanoid robot, stock person, mascot, narrator, or hands.
- No cyberpunk, HUD wall, neon city, code rain, hologram, glass device scene, or meaningless app dashboard.
- No warm paper, watercolor, sketch wobble, comic styling, or isometric diorama.
- No fabricated product logos, vendor branding, benchmarks, performance numbers, protocols, nodes, links, states, or causal claims.
- No tiny unreadable text walls, uncontrolled rainbow palette, arbitrary icon collage, or decorative arrows without semantic meaning.

## Composition Families

### `mechanism-poster`

One central mechanism with three to five surrounding explanation zones and one bottom takeaway rail. Use for causes, internals, performance mechanisms, and design principles.

### `architecture-flow`

One or more source groups, a central processing system, one or more destinations, exact directed paths, explicit boundaries, and one legend or takeaway rail. Use for architecture, lifecycle, routing, data flow, and exception handling.

### `layered-comparison`

Two lanes, two stacked systems, or before/after regions with a shared title hierarchy and one explicit comparison conclusion. Use for inbound/outbound, optimized/unoptimized, old/new, or primary/preview relationships.

The three families are allowed variation, not fixed topology. Golden examples never authorize reuse of their node count, wording, section count, positions, or story.

## Role Contracts

### Cover

- Use a condensed technical poster with approximately 30% less detail than a body infographic.
- Include one oversized title, one central mechanism, three to four explanation zones, and one bottom value rail.
- Preserve a readable thumbnail hierarchy: title first, mechanism second, supporting zones third.
- Do not reduce the cover to a generic title card or overload it with body-level copy.

### Concept

- Explain exactly one mechanism, design principle, transformation, or performance reason.
- Prefer `mechanism-poster` or `layered-comparison`.
- Use three to five sections, compact explanatory copy, supported icons, and one explicit conclusion rail.
- A concept need not show the complete system topology, but its causal or comparative relation must be article-supported.

### Diagram

- Explain architecture, process, direction, boundary, lifecycle, or dual-flow behavior.
- Prefer `architecture-flow` or `layered-comparison`.
- Freeze an article-specific semantic graph before prompting: exact nodes, stable IDs, labels, groups, directed edges, edge types, invariants, and blocked relationships.
- GPT Image 2 may generate the final text-bearing image, but every visible node, label, arrow, direction, boundary, number, and state must match the frozen graph.
- A single semantic mismatch fails the asset. Visual quality never overrides topology correctness.

## Model Selection

- Preferred alias: `gpt-image-2`.
- Selection policy: use the latest alias rather than pinning an older snapshot.
- Current public snapshot at specification time: `gpt-image-2-2026-04-21`.
- Record generation date, prompt hash, adapter, and any model identity returned by the runtime.
- When the host image-generation capability abstracts model selection, record that limitation and do not invent a snapshot identifier.
- Do not fall back to `chatgpt-image-latest`, GPT Image 1.x, DALL-E, or an unspecified third-party generator.

## Text-Bearing Image Generation Exception

The current Skill normally forbids sending dense technical labels or multi-step architecture directly to an image model. Style 9 introduces a narrow, fail-closed exception rather than weakening the global rule.

The exception applies only when all of the following are true:

1. the selected profile is `dense-technical-infographic`;
2. the exact copy ledger is frozen before generation;
3. any diagram semantic graph is frozen before generation;
4. the prompt contains the exact approved title, section copy, labels, and blocked relationships;
5. the generated artifact receives text and semantic validation before approval;
6. failures are corrected, regenerated, or rejected rather than inserted into an article.

All other profiles retain the existing prohibition on dense generated labels and multi-step architecture.

## Production Pipeline

1. Extract confirmed article facts, supported simplifications, unresolved items, and prohibited claims.
2. Freeze an exact copy ledger containing every title, section heading, label, short explanation, number, and takeaway intended to appear.
3. For diagrams, freeze the semantic graph and invariants separately from the visual brief.
4. Compile the Style Pack prompt with the latest approved same-role golden reference and an explicit non-copy contract.
5. Generate with the GPT Image 2 alias.
6. Inspect the raster at full resolution and article-column scale.
7. Compare every visible text and semantic element with the ledgers.
8. Preserve correct native text.
9. Correct an isolated local copy error with a deterministic overlay only when the correction does not damage visual continuity.
10. Regenerate the entire asset when topology, grouping, direction, numbers, or multiple text regions are wrong.
11. Approve and integrate only after all validations pass.

## Validation and Failure Handling

### Text Validation

- The exact title must match.
- Section titles, node labels, numbers, protocol names, English identifiers, and takeaway copy must match the frozen copy ledger.
- Garbled glyphs, duplicated labels, missing punctuation that changes meaning, or invented wording fail validation.

### Semantic Validation

- Every declared node appears exactly once unless the frozen graph explicitly permits repeated views.
- Every directed edge has the correct source, destination, direction, and type.
- Every group and boundary contains only its declared members.
- No forbidden shortcut, invented state, unsupported metric, or unconfirmed relation appears.

### Visual Validation

- The image reads as a dense engineering explainer poster at first glance.
- Title, central mechanism, numbered sections, and takeaway rail remain distinguishable.
- The semantic palette is correctly mapped and controlled.
- The image is fully opaque, platform-compatible, and legible at article width.
- It remains clearly distinct from Styles 1, 4, 5, and 8.

### Correction Policy

- One isolated copy defect: deterministic local correction is allowed.
- Several copy defects or broken hierarchy: regenerate.
- Any topology, direction, grouping, numeric, or factual defect: regenerate or deterministically rebuild; never patch around an uncertain semantic structure.
- Repeated failure: retain the candidate and audit record, revise the responsible prompt or contract field, and do not promote the style pack.

## Golden Production

The three user-provided GPT Image examples are temporary bootstrap references for visual analysis only. They are not copied into the repository as permanent golden assets, and their titles, vendors, topology, icons, and example content are non-authoritative.

Three new GPT Image 2 goldens will be produced in order.

### Golden Cover

- Title: `高并发服务：一次请求如何被稳定处理`
- Family: `mechanism-poster`
- Central mechanism: generic request-processing core.
- Supporting zones: traffic intake, task scheduling, service execution, and exception protection.
- Bottom rail: rate limiting, isolation, caching, and degradation as distinct generic capabilities without performance guarantees.
- Purpose: validate oversized title, condensed poster density, thumbnail hierarchy, and native generated copy.

### Golden Concept

- Title: `背压机制：让生产速度服从处理能力`
- Family: `layered-comparison`
- Upper region: unbounded production leading to queue accumulation.
- Lower region: feedback-driven pressure control between consumer and producer.
- Visual nucleus: buffer level and feedback signal.
- Bottom rail: protect memory, stabilize latency, and reduce cascade risk, expressed without absolute guarantees.
- Purpose: validate causal explanation, before/after comparison, semantic colors, and compact explanatory text.

### Golden Diagram

- Title: `异步任务生命周期：从提交到归档`
- Family: `architecture-flow`
- Primary path: task submission -> validation -> queue -> scheduling -> execution -> result archive.
- Exception path: execution failure -> retry decision.
- Retry allowed: retry decision -> queue.
- Retry denied: retry decision -> failure archive.
- Invariant: no failure state may reach result archive directly.
- Purpose: validate dense exact labels, primary and exception paths, return direction, grouping, and topology audit.

Each golden remains a candidate until the user explicitly approves the displayed image. The final golden set must contain exactly one approved cover, concept, and diagram.

## Qualification Probes

After golden approval, create three cross-topic probes that do not copy any golden topic or layout:

- Cover probe: database read/write separation and failover roles.
- Concept probe: idempotency keys preventing duplicate side effects.
- Diagram probe: event ingestion with validation, dead-letter routing, replay, and audit.

Neighbor discrimination must explicitly compare Style 9 with Styles 1, 4, 5, and 8.

## Repository Changes

Implementation will add or update:

- Style registry and bilingual menu from eight to nine modes.
- Style 9 protocol and token file.
- Style 9 Visual DNA, role contracts, reference matrix, and candidate golden set.
- GPT Image adapter rules for native text-bearing generation under the narrow Style 9 exception.
- Golden-production audit records and request files.
- Cross-topic probe suite.
- Contract, prompt compiler, manifest, and release-validation tests.
- Neighbor descriptions for Styles 1, 4, 5, and 8 where required.
- Public documentation and the CSDN introduction article only after Style 9 qualifies and is approved.

## Test Strategy

- Registry and menu tests require exactly nine ordered profiles.
- Style contract tests assert every required Visual DNA phrase, forbidden trait, role distinction, and renderer rule.
- Prompt compiler tests assert that native dense text is allowed only for Style 9 with a frozen copy ledger and, for diagrams, a frozen semantic graph.
- Negative tests ensure every other style still rejects dense generated technical labels.
- Probe tests compile and lint cover, concept, and diagram requests.
- Neighbor tests verify Style 9 remains flat, dense, precise, and text-forward rather than sparse, glassy, isometric, or handwritten.
- Release validation requires approved goldens, correct hashes, passed qualification fields, fully opaque artifacts, and traceable prompts.

## Non-Goals

- Do not build a general-purpose poster designer.
- Do not guarantee that GPT Image 2 always spells every label correctly.
- Do not accept a visually attractive image with incorrect text or topology.
- Do not copy the supplied Nginx, ZLMediaKit, Netty, Spring, icon, node, or layout content.
- Do not modify the existing eight profiles beyond the minimum registry, menu, and neighbor-boundary updates needed to introduce Style 9.

## Completion Criteria

Style 9 is complete only when:

1. the written contract and tests are implemented;
2. three new GPT Image 2 golden candidates are displayed and explicitly approved;
3. all visible copy and topology pass validation;
4. cross-topic and neighbor-discrimination probes pass;
5. the Style Pack release validator and full test suite pass;
6. the candidate flag is removed only after those gates;
7. the final changes are committed and pushed on the current branch.
