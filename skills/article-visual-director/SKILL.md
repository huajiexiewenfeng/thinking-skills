---
name: article-visual-director
# activation-policy:frontmatter:start
description: "Use whenever the user wants to plan, generate, validate, or insert a coherent set of visuals for an existing or substantially complete Markdown article, especially a technical article for CSDN or WeChat Official Accounts. Covers article covers, concept illustrations, process diagrams, architecture diagrams, visual style selection, image prompts, approval gates, and non-destructive Markdown integration. Do not use as the primary skill for early article ideation or drafting, or for a standalone diagram that is not part of an article."
# activation-policy:frontmatter:end
---

# Article Visual Director

<!-- activation-policy:guard:start -->
Generated from config/activation-policy.yaml. Do not edit this block.

Activation mode: `auto`. This Skill is eligible under its authored domain boundaries. Cross-Skill routing remains owned by `thinking-router`.
<!-- activation-policy:guard:end -->

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

Keep `content-creator` primary while the thesis, argument, outline, or prose is still changing. Use this skill after the content structure is stable. Verify semantics from the article, provided sources, and host-native capabilities. This skill owns the visual plan and document integration.

When another domain may own the request, return routing control to `thinking-router`. Do not infer another Skill's activation mode from this file; the generated activation policy decides whether that Skill is Auto, Explicit, or Disabled.

For a standalone technical diagram unrelated to an article, use the environment's dedicated technical-visual or diagram capability instead.

## Non-Negotiable State Machine

```text
inspect article
  -> present all seven bilingual visual submodes
  -> wait for explicit style selection
  -> propose complete visual plan
  -> wait for plan approval
  -> when 3+ imagegen assets: generate one style anchor
  -> wait for style-anchor approval
  -> render remaining assets
  -> validate every asset
  -> create a new illustrated Markdown copy
```

Do not collapse these gates. A user asking to "do it all" authorizes the workflow, not silent approval of unseen prompts or an unseen style anchor.

## Mandatory Style Selection Gate

Every invocation that will generate article images must present this complete menu before producing the visual plan or calling an image-generation capability:

1. **Technical Editorial Minimal（技术编辑简约）** — 适合技术教程和解释型文章，几何清晰、留白克制。
2. **White-Green Editorial Minimal（白底绿色编辑简约）** — 适合微信公众号 AI 与产业分析，白底绿色、明亮理性。
3. **Neon Systems（霓虹系统科技）** — 深色底配青绿霓虹，适合 Agent、基础设施和高能科技主题。
4. **Blueprint Linework（蓝图线稿）** — 工程制图式线条，适合架构边界、组件结构和系统解析。
5. **Isometric Infrastructure（等距基础设施）** — 等距模块化空间，适合云服务、部署体系和数据管线。
6. **Cinematic Conceptual（电影感概念视觉）** — 单一强隐喻配合克制的戏剧光影，适合战略与哲学议题。
7. **Soft Technical Sketch（柔和技术手绘）** — 纸张、墨线和淡彩质感，适合教程、入门内容和亲和解释。

Use this response shape:

```text
请选择本次配图风格（回复序号、英文名或中文名均可）：
[the complete seven-item menu]
推荐：N. English Name（中文名）— one sentence tied to this article.
```

After inspecting an available article, mark one item as the recommendation but still show all seven. If the article is not yet available, show the menu without a recommendation. If the user named a style in the invoking message, show all seven, mark that item as their current choice, and ask them to confirm it or select another. Do not infer approval from a past invocation or a previous article.

Stop after the menu and wait for an explicit selection. Do not produce the visual plan, freeze prompts, create a manifest, or call image generation before the selection arrives. Style selection approves only the visual submode; the later plan and style-anchor gates still apply.

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

### 2. Obtain explicit style selection

Apply the Mandatory Style Selection Gate. Present the complete bilingual menu and stop until the user explicitly selects one submode. No visual-rhythm decisions or other plan work begin before this selection.

### 3. Choose a sparse visual rhythm

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

### WeChat headline cover title contract

For a WeChat headline cover, the **final published asset includes the approved article title by default**. A text-free final cover is allowed only when the user explicitly chooses it. Approval of a plan or prompt that happens to say `no text` is not an explicit text-free choice unless that trade-off was surfaced to the user.

Keep the two render stages distinct:

1. `imagegen` produces the editorial background with no text.
2. A deterministic SVG/HTML layer adds the exact approved title and exports the final raster cover.

The plan and manifest must record `title.mode`, exact `title.text_lines`, the editable title-source path, and wide/square crop checks. Use `title.mode=text-free` only with `user_opt_out=true`.

When a cross-platform article has separate CSDN and WeChat cover exports, record asset-level `platforms` so the WeChat title contract applies only to the intended cover.

### 4. Establish the selected visual direction

Read the selected profile in [references/style-catalog.md](references/style-catalog.md). Explain its fit in terms of audience, article tone, technical density, and platform—not taste alone. Continue only with that selected profile.

Create one reusable style fingerprint containing:

- palette;
- lighting and contrast;
- geometry and line language;
- material or texture;
- camera/perspective;
- negative-space rule;
- exclusions.

For wide covers, also record two separate composition contracts:

- **wide-canvas occupancy**: how far the intentional foreground hierarchy should extend across the full aspect ratio;
- **crop survival**: the semantic nucleus that must remain meaningful inside alternate crops.

Do not treat a square-safe crop as a container for the complete wide composition. Read the platform-specific occupancy rules before freezing a cover prompt.

Read [references/platform-profiles.md](references/platform-profiles.md) before selecting aspect ratios, title safe zones, or export formats.

### 5. Produce the complete plan and manifest

Before generating anything, present:

1. visual thesis and recommended style;
2. visual rhythm map;
3. one brief per asset;
4. exact image-generation prompt or deterministic diagram specification;
5. intended heading anchor and placement;
6. known semantic uncertainties;
7. proposed filenames and Markdown paths.

For a WeChat headline cover, also present the final title lines and identify the deterministic SVG/HTML title source. If proposing a text-free cover, ask for that choice explicitly before approving the plan.

Each image-generation prompt must specify:

- communicative objective;
- subject and visual metaphor;
- composition and hierarchy;
- style fingerprint;
- palette and lighting;
- aspect ratio and platform safe zone;
- full-width occupancy target and crop-survival contract for wide covers;
- exclusions such as no logos, no watermarks, and no UI gibberish; use `no text` for an image-generated cover background, not as an implicit decision that the final WeChat cover is text-free;
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

### 6. Render through the correct capability

For raster covers and concept illustrations, load and follow the runtime's image-generation skill. Use the approved prompt verbatim except for tool-required syntax. Record any necessary variation back into the manifest before using it.

When the plan contains three or more `imagegen` assets:

1. render one representative style anchor, normally the cover or strongest concept image;
2. show it to the user;
3. wait for approval or correction;
4. set `approvals.style_anchor` to `approved`;
5. use the approved image as the visual reference for the remaining raster assets.

For deterministic assets, use an available Mermaid, Graphviz, SVG, HTML, or visualization renderer. Export a platform-compatible PNG when SVG support is uncertain. Preserve the editable source next to the export when practical.

### 7. Validate every artifact

Inspect each rendered artifact before integration. Mark `validation_status=passed` only if it satisfies all applicable checks:

- matches the approved brief and style fingerprint;
- contains no invented technical relationships;
- labels, arrows, numbers, and boundaries are correct;
- no garbled text, watermark, accidental logo, or obvious generation defect;
- crop and title-safe region work for the target platform;
- a WeChat headline cover contains the exact approved title unless `title.mode=text-free` and `user_opt_out=true`;
- deterministic cover-title source exists, and both full-width and central-square title crops were checked;
- wide-cover foreground occupancy passes the platform profile; square safety has not compressed the complete subject into a small central island;
- body illustrations remain legible at article column width;
- alt text explains the information or purpose, not merely the appearance.

If an asset fails, regenerate or revise it and validate again. Do not insert a failed asset.

### 8. Integrate non-destructively

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

### 9. Hand off the result

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
