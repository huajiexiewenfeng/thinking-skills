---
name: article-visual-director
description: Use whenever the user wants to plan, generate, validate, or insert a coherent set of visuals for an existing or substantially complete Markdown article, especially a technical article for CSDN or WeChat Official Accounts. Covers article covers, concept illustrations, process diagrams, architecture diagrams, visual style selection, image prompts, approval gates, and non-destructive Markdown integration. Do not use as the primary skill for early article ideation or drafting, or for a standalone diagram that is not part of an article.
---

# Article Visual Director

Turn an approved Markdown article into a coherent illustrated edition. Direct the visual system first, generate only after approval, use deterministic rendering for exact technical meaning, and integrate only validated assets into a new Markdown copy.

## Method Bases

Core:

- Information hierarchy and editorial visual rhythm
- Visual metaphor mapping for abstract concepts
- Diagram semantics: entities, boundaries, direction, sequence, and trust
- Art direction through reusable style fingerprints
- Approval-gated production

Supporting:

- Progressive disclosure
- Cognitive-load management
- Platform-aware composition and safe zones
- Accessibility through useful alt text
- Reproducible build manifests and idempotent document transforms

Safety:

- Never invent a node, edge, boundary, sequence, data flow, or causal relationship that the article does not support.
- Separate article facts, reasonable visual simplifications, and unresolved assumptions.
- Do not imitate a living artist. Translate a style request into general visual properties.
- Do not overwrite the source Markdown. Do not integrate unapproved or unvalidated assets.

## Routing Boundary

Use this skill as primary when the user has an existing or nearly final Markdown article and wants any combination of:

- a cover and section illustrations;
- visual theme or style recommendations;
- prompts prepared before image generation;
- precise process, architecture, comparison, timeline, or chart visuals;
- generated images inserted back into Markdown.

Keep `content-creator` primary while the thesis, argument, outline, or prose is still changing. Use this skill after the content structure is stable. A mixed request may use `technical-deep-dive` as secondary context only after valid explicit invocation in the current request; otherwise verify semantics from the article, provided sources, and host-native capabilities. This skill owns the visual plan and document integration.

For a standalone technical diagram unrelated to an article, use the environment's dedicated technical-visual or diagram capability instead.

## Non-Negotiable State Machine

```text
inspect article
  -> propose complete visual plan
  -> wait for plan approval
  -> when 3+ imagegen assets: generate one style anchor
  -> wait for style-anchor approval
  -> render remaining assets
  -> validate every asset
  -> create a new illustrated Markdown copy
```

Do not collapse these gates. A user asking to "do it all" authorizes the workflow, not silent approval of unseen prompts or an unseen style anchor.

## Workflow

### 1. Inspect the source without changing it

Read the Markdown and record:

- source path and whole-file SHA-256;
- UTF-8 versus UTF-8 BOM;
- LF versus CRLF;
- frontmatter boundaries;
- heading hierarchy, existing images, tables, and fenced code blocks;
- target platform: `csdn`, `wechat`, or both;
- article thesis, audience, tone, and the few sections where a visual materially improves comprehension.

If the source file or target platform is missing and cannot be discovered, ask one short question. Otherwise recommend a default and continue.

For technical content, create a compact semantic ledger:

- **confirmed**: explicitly stated or verified from source material;
- **simplification**: visually compressed but semantically faithful;
- **unconfirmed**: must not appear as a factual connection until the user confirms it.

### 2. Choose a sparse visual rhythm

Do not make one image for every heading by default. Prefer:

1. one cover;
2. concept illustrations at the highest-value summaries or mental-model transitions;
3. deterministic diagrams only where exact structure, sequence, comparison, or boundaries matter.

Use this renderer rule:

| Need | Renderer | Reason |
|---|---|---|
| Mood, metaphor, editorial cover, abstract concept | `imagegen` | Composition and atmosphere matter more than exact topology |
| Flow, architecture, boundary, comparison, timeline | `deterministic-diagram` | Nodes, labels, edges, and direction must be exact |
| Quantitative relationship backed by data | `deterministic-chart` | Values and scales must be reproducible |

Never send dense technical labels, source code, or a multi-step architecture to an image model. If a cover needs an exact title, generate the background without text and add title typography with a deterministic SVG/HTML layer.

### 3. Recommend the visual direction

Read [references/style-catalog.md](references/style-catalog.md). Recommend one primary style and two meaningfully different alternatives unless the user has already narrowed the direction. Explain the recommendation in terms of audience, article tone, technical density, and platform—not taste alone.

Create one reusable style fingerprint containing:

- palette;
- lighting and contrast;
- geometry and line language;
- material or texture;
- camera/perspective;
- negative-space rule;
- exclusions.

Read [references/platform-profiles.md](references/platform-profiles.md) before selecting aspect ratios, title safe zones, or export formats.

### 4. Produce the complete plan and manifest

Before generating anything, present:

1. visual thesis and recommended style;
2. visual rhythm map;
3. one brief per asset;
4. exact image-generation prompt or deterministic diagram specification;
5. intended heading anchor and placement;
6. known semantic uncertainties;
7. proposed filenames and Markdown paths.

Each image-generation prompt must specify:

- communicative objective;
- subject and visual metaphor;
- composition and hierarchy;
- style fingerprint;
- palette and lighting;
- aspect ratio and platform safe zone;
- exclusions such as no text, no logos, no watermarks, no UI gibberish;
- continuity cues shared with the rest of the article.

Each deterministic diagram specification must list:

- nodes with exact labels;
- groups or trust boundaries;
- directed edges with exact meaning;
- sequence or reading order;
- confirmed source for each non-obvious relationship;
- explicitly blocked unconfirmed relationships.

Create the manifest described in [references/manifest-schema.md](references/manifest-schema.md). Treat it as the source of truth. Set approvals to `pending` until the user confirms the plan. After confirmation, freeze prompts/specifications and set the relevant approvals to `approved`.

End the planning response with one compact approval request. Do not generate images in that response.

### 5. Render through the correct capability

For raster covers and concept illustrations, load and follow the runtime's image-generation skill. Use the approved prompt verbatim except for tool-required syntax. Record any necessary variation back into the manifest before using it.

When the plan contains three or more `imagegen` assets:

1. render one representative style anchor, normally the cover or strongest concept image;
2. show it to the user;
3. wait for approval or correction;
4. set `approvals.style_anchor` to `approved`;
5. use the approved image as the visual reference for the remaining raster assets.

For deterministic assets, use an available Mermaid, Graphviz, SVG, HTML, or visualization renderer. Export a platform-compatible PNG when SVG support is uncertain. Preserve the editable source next to the export when practical.

### 6. Validate every artifact

Inspect each rendered artifact before integration. Mark `validation_status=passed` only if it satisfies all applicable checks:

- matches the approved brief and style fingerprint;
- contains no invented technical relationships;
- labels, arrows, numbers, and boundaries are correct;
- no garbled text, watermark, accidental logo, or obvious generation defect;
- crop and title-safe region work for the target platform;
- body illustrations remain legible at article column width;
- alt text explains the information or purpose, not merely the appearance.

If an asset fails, regenerate or revise it and validate again. Do not insert a failed asset.

### 7. Integrate non-destructively

Run the validator before applying the plan:

```powershell
python skills/article-visual-director/scripts/validate_manifest.py --manifest visual-manifest.json --phase integration
```

Then create the illustrated copy:

```powershell
python skills/article-visual-director/scripts/apply_visual_plan.py --manifest visual-manifest.json
```

The integration script:

- verifies the source and section hashes;
- ignores headings inside frontmatter and fenced code blocks;
- copies validated artifacts to their Markdown paths;
- inserts stable `article-visual` markers;
- preserves BOM and line endings;
- refuses to overwrite the source unless explicit `--source`, `--out`, and `--allow-source-overwrite` arguments acknowledge the risk;
- creates `-v2`, `-v3`, and later siblings when the requested illustrated output already exists;
- defaults to `{source-stem}-illustrated.md`;
- is idempotent on repeated execution.

The skill workflow must always use a new illustrated copy. The low-level `--allow-source-overwrite` escape hatch exists for explicit operator-controlled recovery and must never be inferred from a general request to insert images.

### 8. Hand off the result

Report:

- illustrated Markdown path;
- manifest path;
- generated and deterministic source asset paths;
- which assets passed validation;
- any platform caveats or unresolved semantic decisions;
- confirmation that the source was unchanged.

## Failure Rules

Stop and explain the blocking evidence when:

- the article changed after plan approval;
- an exact heading or section context no longer matches;
- a diagram depends on an unconfirmed relationship;
- a generated artifact is missing or failed validation;
- a published asset path conflicts with different existing content or any destination collides with the source, manifest, output, or another asset;
- the user asks to overwrite the source without explicitly acknowledging that risk.

Do not recover by guessing a new anchor, silently rewriting prompts, or weakening the validation state.
