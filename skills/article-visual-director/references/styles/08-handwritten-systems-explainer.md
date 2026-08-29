# Handwritten Systems Explainer

## Identity

- `profile_id`: `handwritten-systems-explainer`
- Protocol version: `2`
- 中文名: 手写系统解释图
- Promise: turn a dense technical idea into an annotation-led technical whiteboard with lively ink, pastel-to-medium semantic color, formulas, and small teaching moments.

## Use When

Use for AI internals, agents, runtimes, retrieval, context windows, performance trade-offs, before/after systems, mathematical relationships, and engineering explanations that benefit from labels, formulas, arrows, and a visible narrator.

## Do Not Use When

Do not use for text-free atmospheric covers, low-density emotional metaphors, corporate card layouts, photorealism, or architecture whose exact topology cannot be confirmed.

## Mode Boundary

The nearest neighbor is Soft Technical Sketch. Style 7 is a quiet, low-density metaphor illustration with fine contours, broad watercolor washes, minimal annotation, and no handwritten technical labels. Style 8 is an organized, high-density teaching whiteboard: handwritten formulas, compact side notes, underlined conclusions, highlighted headings, meters/tables, and miniature instructor figures are first-class elements. Soft color does not make the two modes interchangeable; annotation density and technical teaching grammar decide the boundary.

## Required Visual Traits

- Warm ivory technical-whiteboard paper with subtle grain and lively near-black `#242321` ink around 2 px at 1600×900.
- A controlled pastel-to-medium palette: soft blue, mint, lavender, butter yellow, and warm sand for annotations; clearer blue, green, and orange for primary semantic nodes; restrained coral for exceptions.
- One explicit reading path composed from formula boxes, arrows, brackets, dashed boundaries, small tables, meters, tokens, caches, speech bubbles, and underlined summary statements.
- Handwritten formulas and short technical annotations remain compact but legible; exact wording is rendered deterministically when correctness matters.
- Miniature instructor figures may point, question, compare, or react in covers and concept illustrations. They support explanation and never become decorative mascots.
- Layout is information-dense but organized into two or three groups with generous internal whitespace and no ornamental UI chrome.

## Allowed Variation

The layout may be radial, two-column, two-lane, or left-to-right. Headings may sit on pastel highlight swatches or compact black section tabs; formulas may use soft or medium blue/green/orange/lavender boxes; small cartoon hands, faces, clocks, gauges, magnifiers, cubes, and trash/cache icons may clarify meaning in narrative assets. Architecture diagrams contain no people, faces, hands, or narrator figures. Slight line wobble, irregular underline length, and offset color washes are desirable.

## Forbidden Traits

No black tabs on every node, uncontrolled high-saturation blocks, generic corporate flowchart cards, 3D prism, isometric infrastructure, glassmorphism, page-theme green takeover, uniform vector-perfect strokes, dense decorative doodle clutter, or generated gibberish presented as real formulas.

## Cover Contract

Use a wide 16:9 or platform-specific canvas with one strong technical thesis and two to four explanatory groups. The visual nucleus survives the central crop, while annotations and small teaching figures activate the outer bands. A title may be added deterministically over a pastel swatch or clean paper zone. A cover can be information-rich, but the reading order must remain obvious at thumbnail size.

## Concept Contract

Explain one technical mechanism or contrast with a visible narrator, formula/object boxes, semantic pastel fills, and a concluding underline or short takeaway. Prefer a causal teaching sequence over a generic collection of cards. Use one compact analogy only when it clarifies a real relationship.

## Deterministic Diagram Contract

Map paper to `surface.background`, all contours/arrows/text to `boundary_and_text`, transient/pressure work to `pressure_or_payload`, query/reference/context to `reference_or_context`, persistent/reused/output states to `durable_or_available`, warnings to `risk_or_failure`, secondary concepts to `secondary_concept`, and headings/conclusions to `emphasis_highlight`. Use 2 px variable-looking strokes, 10 px rounded nodes or formula boxes, soft annotation swatches, optional black section tabs for group headings only, numbered stages, dashed architecture boundaries, direct primary arrows, restrained coral dashed exception or fallback paths, small annotation text, and an underlined conclusion. Do not use people, faces, hands, mascots, or narrator figures in this asset type. Render exact numbers, formulas, and labels with KaiTi/STKaiti-compatible fonts.

Before rendering, derive a fresh article-specific semantic graph containing exact nodes, labels, groups, directed edges, edge types, invariants, and blocked relationships. Validate the graph independently of the golden image, freeze it, then render it with this profile's visual tokens. After rendering, compare every visible relationship with the frozen graph; topology drift is a hard failure.

## Imagegen Prompt Contract

State the lesson objective, exact technical mechanism, audience, grouping, reading path, formulas or objects, asset-type figure policy, pastel-to-medium semantic mapping, warm paper, fine lively ink, annotation density, target aspect ratio, and deterministic-text plan. Attach the approved references and preserve their line weight, controlled marker-fill behavior, formula-box/node grammar, arrows, underlines, density, and whitespace. Narrative covers and concept illustrations may use miniature figures; architecture and process diagrams must explicitly request no people. Request blank annotation zones when exact text will be overlaid. Negatives: black tabs on every node, uncontrolled saturation, generic corporate flowchart styling, 3D/isometric, glass, vector-perfect lines, decorative doodles, fake formulas, logos, and watermarks.

## Reference Use Contract

Use the approved cover to anchor wide teaching composition, the concept image to anchor narrator/formula/annotation vocabulary, and the approved diagram as a style-only reference for architecture density, grouping, node geometry, arrow appearance, semantic pastel roles, spacing, and conclusion treatment. The golden topology is non-authoritative: its example labels, nodes, arrows, groups, numbers, and paths must never become article content by imitation. Article-specific references may influence technical objects but may not replace these profile invariants or the frozen semantic graph. Preserve visual grammar, never copy a reference's wording or unsupported relationships.

## Validation Rubric

Pass only if the result reads like an annotated technical whiteboard; uses fine lively ink and warm paper; keeps pastel-to-medium semantic color controlled; contains a clear technical reading path; keeps formulas/labels accurate or blank for deterministic overlay; limits figures to narrative assets and keeps architecture diagrams human-free; matches every node, edge, direction, boundary, and invariant in the frozen semantic graph; stays dense but organized; aligns generated and deterministic assets; and contains no every-node black-tab, corporate-card, 3D, or theme-bleed drift.
