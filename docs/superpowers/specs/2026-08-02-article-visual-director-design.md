# Article Visual Director Design

**Date:** 2026-08-02
**Status:** Approved design
**Target project:** Thinking Skills

## Context

`content-creator` can currently provide one core visual Prompt after a full article, while `imagegen` can execute individual bitmap-generation requests. The missing layer is article-level visual direction: deciding where visuals materially help, maintaining one visual language across the article, selecting the correct renderer for each visual, obtaining approval before generation, validating the results, and inserting approved assets into Markdown.

The first release targets Chinese technical articles published to WeChat Official Accounts and CSDN. Its dominant outputs are a cover and concept illustrations. Process and architecture diagrams are included when technical relationships require exact representation.

## Decision

Create a standalone first-party Thinking Skill named `article-visual-director`.

The skill owns article-level visual planning, approval, renderer selection, asset quality control, and Markdown integration. It delegates raster execution to `imagegen` and uses deterministic diagram generation for visuals with exact labels or relationships.

Rejected alternatives:

- Expanding `content-creator` would mix writing, art direction, generation, and file mutation in one large skill.
- Splitting raster illustration and technical-diagram integration into two new skills would create unnecessary routing and coordination overhead for the first release.

## Goals

- Turn a structurally stable Markdown technical article into a coherent visual plan.
- Recommend a theme and selectable visual styles based on the article's thesis, reader, technical density, and publishing platform.
- Provide complete Prompts and composition logic before generating any image.
- Generate covers and section-level concept illustrations with consistent visual DNA.
- Generate accurate process, architecture, comparison, or timeline diagrams through deterministic renderers.
- Validate every asset before inserting it into Markdown.
- Produce a new illustrated Markdown file by default while preserving the source.
- Preserve final Prompts and editable technical-diagram sources for later regeneration.

## Non-Goals

- Writing, restructuring, or fact-checking the article itself.
- Inventing missing architecture, data, system relationships, or technical claims.
- Mechanically placing one image after every heading.
- Generating product UI, slide decks, or an offline technical visual companion.
- Replacing a direct single-image edit or generation request that belongs to `imagegen`.
- Uploading assets to CSDN or WeChat, or publishing the article on the user's behalf.
- Overwriting the source Markdown without explicit approval.

## Routing and Boundaries

Use `article-visual-director` as the primary route when the immediate task is to plan, generate, or insert a coherent set of visuals for an existing article.

Keep `content-creator` primary while the article still needs positioning, outlining, drafting, or substantial revision. It may hand off the stable article and its running content brief after the writing stage.

Use `imagegen` directly when the user requests a single standalone bitmap and does not need article-level visual planning. Use deterministic technical-diagram tooling when exact labels, directions, states, or boundaries matter. `technical-visual-companion` remains responsible for a separate, self-contained offline HTML technical visual and is not a Markdown-image dependency.

The skill reads only the Markdown file and references named by the user. It does not scan a repository to infer missing technical facts unless the user expands the source scope.

## Inputs

Required:

- A Markdown file path or complete Markdown content.
- A structurally stable heading and section layout.

Complete content without a file path supports planning and Prompt generation. Asset insertion requires the user to approve a destination Markdown path before the integration stage.

Optional:

- Target platform: CSDN, WeChat Official Account, or both.
- Style preference or reference images.
- Desired visual density.
- Output directory.
- A `content-creator` running brief containing topic, audience, thesis, tone, and accepted decisions.

When the platform is omitted, infer it only when the surrounding request makes it clear; otherwise ask one concise question.

## Method Bases

```yaml
method_bases:
  core:
    - Editorial art direction
    - Visual hierarchy and information design
    - Semantic visual-beat selection
    - Cross-asset visual narrative consistency
  supporting:
    - Cognitive-load-aware illustration
    - Diagram taxonomy and renderer selection
    - Platform-specific publishing design
    - Accessible image descriptions
  reflective: []
  safety:
    - Do not invent technical facts, relationships, labels, or source data
    - Do not imitate a living artist's style
    - Preserve the source article and existing assets by default
    - Do not introduce unapproved logos, brand marks, or sensitive content
```

## Outputs

Before approval:

- One recommended visual direction and two meaningfully different alternatives.
- A global style profile.
- A visual plan covering the cover and selected section visuals.
- For every proposed asset: insertion anchor, purpose, key takeaway, visual type, renderer, composition, ratio, Prompt or diagram specification, filename, alt text, and optional caption.
- A preview of the intended Markdown insertion points.

After approval:

- `visual-manifest.json`, the single machine-readable source of truth.
- Generated and validated raster assets.
- Editable diagram or title-overlay sources.
- `{source-stem}-illustrated.md` by default.
- A completion report listing generated, revised, skipped, and pending assets and their final Prompts.

## Architecture

### Markdown Analyzer

Parse frontmatter, headings, prose, code fences, lists, tables, and existing image references. Build a section model and record the source encoding, line-ending style, and SHA-256 digest. Existing images are preserved unless replacement is explicitly requested.

### Visual Beat Selector

Select semantic visual beats rather than counting headings. A section is a candidate when a visual would clarify a core concept, mental model, process, state change, system boundary, component relationship, comparison, timeline, or major conclusion. Skip visuals that merely repeat clear prose or code.

Every candidate must answer: "What will this image help the reader understand faster or remember longer?"

### Art Director

Derive a visual metaphor and recommend a style from the article's core tension, technical density, emotional temperature, and platform. Produce one recommended direction and two alternatives. Once approved, freeze a global style profile containing:

- theme and metaphor;
- medium and texture;
- primary and secondary palette;
- lighting and depth;
- recurring motifs;
- composition and whitespace rules;
- text policy;
- continuity constraints;
- avoid rules.

### Visual Manifest

Use `visual-manifest.json` as the only persisted plan. A human-readable plan is rendered from it in the conversation; do not maintain a second editable plan file that can drift.

Top-level fields include:

- manifest version;
- source path and SHA-256;
- article slug;
- target platforms;
- output paths;
- style profile;
- plan approval and style-anchor approval state;
- asset records;
- final integration and verification state.

Each asset record includes:

- stable asset ID and role;
- heading plus nearby-context digest as the insertion anchor;
- reader takeaway and visual purpose;
- renderer and output format;
- dimensions, ratio, and safe-area rules;
- Prompt or deterministic diagram specification;
- filename, relative Markdown path, alt text, and caption;
- approval, generation, validation, and insertion status;
- editable source and final artifact paths.

### Renderer Router

Choose the renderer from the information contract:

| Content contract | Renderer |
|---|---|
| Cover, atmosphere, metaphor, abstract concept | `imagegen` |
| Exact sequence, state, boundary, component, or data flow | Deterministic diagram |
| Exact comparison or timeline labels | Deterministic diagram |
| Verified structured numeric data | Deterministic chart |
| Approximate relationship without exact labels | Concept illustration may be used |
| Unconfirmed data or relationships | Block the asset and request confirmation |

### Raster Renderer

Use the built-in `imagegen` path by default and issue one generation call per distinct asset. Include the approved style fingerprint in every Prompt and use the approved style-anchor image as a reference when supported. Preserve user-provided references and label their roles explicitly.

### Diagram Renderer

Create editable Mermaid, SVG, or HTML/CSS source according to the relationship type, then export a publication-compatible PNG or SVG. Exact labels and relationships come only from confirmed article content. The Markdown version shared across platforms defaults to PNG; editable sources remain under `sources/`.

### Markdown Integrator

Verify the source digest and insertion anchors before editing. Insert only validated assets, use forward-slash relative paths, and preserve encoding and line endings.

Wrap each generated insertion in stable HTML comments so repeated application is idempotent:

```markdown
<!-- article-visual:start asset-02 -->
![Alt text](assets/article-slug/02-concept-runtime-loop.png)
*Optional caption*
<!-- article-visual:end asset-02 -->
```

Never insert inside frontmatter, code fences, tables, or an unintended list level. If an anchor is ambiguous, stop instead of guessing.

## Workflow and Approval Gates

1. Read and parse the named Markdown source.
2. Select visual beats and assign a visual purpose to each.
3. Recommend one primary and two alternative art directions.
4. Build and present the complete visual plan.
5. **Plan approval gate:** do not generate or modify files until the user approves the plan.
6. For three or more raster assets, generate one representative cover or concept image as the style anchor.
7. **Style-anchor approval gate:** do not generate the remaining raster set until the user approves the anchor. Skip this gate for a one- or two-image task unless requested.
8. Generate remaining raster assets and deterministic diagrams independently.
9. Inspect each output and make targeted, single-variable revisions.
10. Validate the complete asset set and Markdown integration preconditions.
11. Create the illustrated Markdown copy and verify every inserted link.
12. Report final artifacts, Prompts, renderers, revisions, and any pending gates.

Approval may apply to the whole plan or selected assets. A later change to one asset invalidates only that asset's downstream approval and verification states unless it changes the global style profile.

## Style and Prompt System

Initial style families:

- Technical Editorial Minimal;
- Neon Systems;
- Blueprint Linework;
- Isometric Infrastructure;
- Cinematic Conceptual;
- Soft Technical Sketch.

Style descriptions use visual attributes and must not request imitation of a living artist.

Raster Prompts use only the relevant fields from this contract:

```text
Use and publishing slot
Section takeaway
Subject and visual metaphor
Scene and spatial relationship
Style and medium
Composition and camera
Lighting and mood
Shared palette and continuity motifs
Ratio, safe area, and mobile constraints
Exact text, if any
Must-preserve constraints
Avoid rules
```

Do not paste the whole article into every Prompt. Use the smallest self-contained section context that preserves the intended meaning.

Body concept illustrations contain no text by default. Exact technical labels belong in deterministic diagrams. When a cover needs an exact Chinese title, generate a text-free visual base and add the title deterministically with SVG or HTML/CSS; preserve the overlay source.

## Platform Profiles

### CSDN

- Use a 16:9 cover by default.
- Favor landscape body visuals when labels remain readable.
- Allow shared body assets with WeChat only after mobile validation.
- Keep technical diagrams searchable and editable through preserved sources even when Markdown references PNG.

### WeChat Official Account

- Use a 2.35:1 headline cover, commonly 900x383, with the title and primary subject inside a central square-safe region.
- Do not reuse a generic 16:9 cover and describe it as WeChat-ready.
- Prefer vertical, stacked, or segmented technical diagrams at mobile width.
- Keep concept images visually clean and avoid tiny labels.

### Dual-Platform Output

- Generate separate platform covers under one approved theme.
- Reuse body concept illustrations only when both platforms pass visual review.
- Produce a mobile-specific technical-diagram variant when a desktop layout cannot remain readable at 390px.

## Default File Layout

```text
article-directory/
├─ article.md
├─ article-illustrated.md
└─ assets/
   └─ article-slug/
      ├─ visual-manifest.json
      ├─ 01-cover-csdn.png
      ├─ 01-cover-wechat.png
      ├─ 02-concept-agent-loop.png
      ├─ 03-architecture-runtime.png
      └─ sources/
         ├─ 01-cover-title-overlay.svg
         ├─ 03-architecture-runtime.svg
         └─ 03-architecture-runtime.mmd
```

Use stable numeric prefixes and short ASCII slugs. Version existing files instead of overwriting them unless replacement was explicitly approved.

## Error Handling

- Source changed after approval: invalidate affected anchors and re-analyze before generation or insertion.
- Duplicate or ambiguous anchor: stop the affected insertion.
- One generation failed: retry or block only that asset; do not restart the batch.
- Style drift: revise one specified variable at a time and revalidate the asset.
- Unconfirmed technical relationship: block the corresponding diagram while allowing independent approved assets to continue.
- Image generation unavailable: preserve the approved manifest and Prompts with a pending status.
- Asset failed validation: do not insert its Markdown reference.
- Output exists: create a versioned sibling.
- Partial completion: report exact per-asset states and do not claim the illustrated article is complete.

## Verification

Raster asset checks:

- matches the approved takeaway and metaphor;
- follows the approved style profile;
- has correct ratio, safe area, crop, and resolution;
- contains no unintended text, logo, watermark, or unrelated subject;
- remains coherent with the full visual set.

Diagram checks:

- nodes, edges, order, direction, boundaries, and labels match confirmed facts;
- no overlap, clipping, broken connector, or ambiguous direction exists;
- desktop and explicit 390px reviews pass;
- editable source and rendered artifact agree.

Markdown checks:

- source prose and structure are unchanged except approved insertions;
- every relative asset path exists;
- no insertion landed in protected syntax;
- a second application produces no duplicate insertion;
- output encoding and line endings remain valid;
- the illustrated file can be parsed and reread successfully.

## Skill Package

```text
skills/article-visual-director/
├─ SKILL.md
├─ references/
│  ├─ style-catalog.md
│  ├─ platform-profiles.md
│  └─ manifest-schema.md
└─ scripts/
   ├─ validate_manifest.py
   ├─ apply_visual_plan.py
   └─ tests/
      ├─ test_validate_manifest.py
      └─ test_apply_visual_plan.py
```

Do not add `agents/openai.yaml`; the repository currently discovers canonical skills from the whole `skills/` directory and has no such per-skill convention.

Repository integration also updates:

- `skills/thinking-router/SKILL.md`;
- `evals/article-visual-director-cases.md`;
- response and route benchmark cases;
- `README.md` and `README.zh.md`;
- `docs/routing.md`, `docs/method-bases.md`, and `docs/roadmap.md`;
- hard-coded OpenCode and Cursor skill registries where applicable.

## Testing Strategy

Follow skill TDD before writing the new `SKILL.md`:

1. Run no-skill baseline scenarios and record failures such as immediate generation, mechanical over-illustration, style inconsistency, rasterized architecture text, missing approval, missing Prompt preservation, or destructive Markdown edits.
2. Write the minimal skill guidance that addresses observed failures.
3. Re-run the same scenarios with the skill.
4. Tighten only demonstrated gaps and repeat until behavior is stable.

Evaluation coverage uses at least five positive, three negative, and two mixed-intent cases. It includes CSDN, WeChat, dual-platform, existing-image preservation, architecture-heavy content, early-stage writing that must remain with `content-creator`, direct single-image generation, and offline HTML technical-visual requests.

Deterministic script tests cover:

- frontmatter and code-fence protection;
- duplicate headings and contextual anchors;
- Chinese Markdown content;
- source-digest mismatch;
- missing or unvalidated assets;
- path normalization;
- encoding and line-ending preservation;
- idempotent repeated application;
- versioned output behavior.

Repository verification includes the existing benchmark unit suite, benchmark case loading, skill structure validation, changed-file checks, and a final diff review. Route reports remain separate from response-quality reports; only trusted host traces may claim actual Skill loading.

## Acceptance Criteria

The implementation is complete only when:

- the new skill is discoverable and correctly routed;
- the no-skill baseline failures are documented and the same scenarios improve with the skill loaded;
- all manifest and Markdown-integration tests pass;
- repository benchmark tests and case loading pass;
- a representative Markdown fixture produces an approved manifest, distinct CSDN and WeChat covers, at least one concept illustration, at least one deterministic technical diagram, and an idempotently updated illustrated Markdown copy;
- every final asset passes its renderer-specific checks;
- the source Markdown remains recoverable and, in the default non-destructive mode, unchanged;
- documentation and platform registries match the actual implementation.
