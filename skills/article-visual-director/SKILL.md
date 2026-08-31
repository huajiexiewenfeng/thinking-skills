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
- For reference use, `golden content is non-authoritative`: golden assets define visual grammar, never article facts or topology.
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
  -> present the existing nine bilingual modes
  -> wait for explicit style selection
  -> load selected protocol and approved golden set
  -> separate publication theme, visual profile, and asset semantics
  -> propose complete visual plan
  -> wait for plan approval
  -> evaluate article-style-anchor requirement
  -> generate and approve the anchor when required
  -> render remaining assets
  -> validate semantics, visual contract, and series continuity
  -> create a new illustrated Markdown copy
```

Do not collapse these gates. A user asking to "do it all" authorizes the workflow, not silent approval of unseen prompts, an unapproved permanent golden set, or an unseen article anchor.

## Mandatory Style Selection Gate

Every invocation that will generate article images must present this complete menu before producing the visual plan or calling an image-generation capability:

1. **Technical Editorial Minimal（技术编辑简约）** — 适合技术教程和解释型文章，几何清晰、留白克制。
2. **White-Green Editorial Minimal（白底绿色编辑简约）** — 适合微信公众号 AI 与产业分析，白底绿色、明亮理性。
3. **Neon Systems（霓虹系统科技）** — 深色底配青绿霓虹，适合 Agent、基础设施和高能科技主题。
4. **Polished Tech Explainer（质感科技图解）** — 冷白网格、钴蓝系统逻辑、玻璃科技质感与丰富信息层，适合 AI 系统、产品架构、技术流程和发布级科技图解。
5. **Isometric Infrastructure（等距基础设施）** — 等距模块化空间，适合云服务、部署体系和数据管线。
6. **Cinematic Conceptual（电影感概念视觉）** — 单一强隐喻配合克制的戏剧光影，适合战略与哲学议题。
7. **Soft Technical Sketch（柔和技术手绘）** — 纸张、墨线和淡彩质感，适合教程、入门内容和亲和解释。
8. **Handwritten Systems Explainer（手写系统解释图）** — 米白纸面、手绘框线和少量高亮色，适合解释 Agent、Runtime、检索边界与前后对比。
9. **Dense Technical Infographic（高密度技术信息图）** — 白底、深海军蓝标题、扁平矢量图标、高密度分区与底部总结栏，适合框架原理、中间件、网络协议、并发模型和系统架构教程。

Use this response shape:

```text
请选择本次配图风格（回复序号、英文名或中文名均可）：
[the complete nine-item menu]
推荐：N. English Name（中文名）— one sentence tied to this article.
```

After inspecting an available article, mark one item as the recommendation but still show all nine. If the article is not yet available, show the menu without a recommendation. If the user named a style in the invoking message, show all nine, mark that item as their current choice, and ask them to confirm it or select another. Do not infer approval from a past invocation or a previous article.

Stop after the menu and wait for an explicit selection. Do not produce the visual plan, freeze prompts, create a manifest, or call image generation before the selection arrives. Style selection approves only the visual submode; the later plan and style-anchor gates still apply.

## Workflow

### 1. Inspect the source without changing it

Read the Markdown and record:

- source path and whole-file SHA-256;
- UTF-8 versus UTF-8 BOM;
- LF versus CRLF;
- frontmatter boundaries;
- heading hierarchy, existing images, tables, and fenced code blocks;
- target platform: `csdn`, `wechat`, `x-article`, or a combination;
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

Never send dense technical labels, source code, or a multi-step architecture to an image model by default. If a cover needs an exact title, generate the background without text and add title typography with a deterministic SVG/HTML layer.

### Style 9 native-copy exception

Only `dense-technical-infographic` may generate exact native copy. Freeze every intended visible string in the `text_policy.exact_text` copy ledger with `copy_ledger_status=frozen` and require exact post-generation text validation. This exception changes text handling only; it does not select an API model or authorize CLI/API execution. A Style 9 diagram still requires `semantics.frozen_graph`, followed by node, label, edge, direction, group, and invariant equality review. Correct native copy stays native; one isolated copy defect may receive a deterministic local correction, while multiple-copy, numeric, grouping, direction, or topology defects require regeneration or deterministic rebuild. A validation failure never permits accepting wrong text.

### Cover title and value-point contract

For a WeChat headline cover, the **final published asset includes the approved article title by default**. A text-free final cover is allowed only when the user explicitly chooses it. CSDN and X Article covers may omit a title contract; when they include exact title text or core value points, use the same deterministic two-stage delivery contract.

Keep the two render stages distinct:

1. `imagegen` produces the editorial background with no text.
2. A deterministic SVG/HTML layer adds the exact approved title plus up to four short supporting points and exports the final raster cover.

For deterministic cover text, the plan and manifest record `title.mode`, exact `title.text_lines`, optional `title.supporting_points`, the text-free `title.background_artifact_path`, the editable `title.editable_source_path`, and crop checks. Wide-crop verification is required for every deterministic cover; square-crop verification is additionally required for WeChat. Use `title.mode=text-free` only with `user_opt_out=true`.

When a cross-platform article has separate cover exports, record asset-level `platforms` so each export receives only its applicable crop and title requirements.

### 4. Establish the selected visual direction

Read [references/style-registry.json](references/style-registry.json), locate the exact selected profile, then read only that entry's protocol, token file, and golden-set metadata. If that entry declares `style_pack_version=3`, also load its Visual DNA, role contracts, reference matrix, and registered adapter contract. Do not load or blend the other eight protocols. Explain the selected mode's fit in terms of audience, article tone, technical density, and platform—not taste alone.

The selected golden set must have `status=approved`, explicit user approval, and exactly three verified anchors: cover, concept, and diagram style anchor. If it is missing or still `candidate`, stop article production with `golden_set_pending`. Explain that this visual mode has no approved permanent style anchors yet and enter the golden-production flow only after the user agrees. Golden-production order is cover, concept, then architecture/process style anchor; candidates become golden only after explicit user approval and release validation.

In golden production for a registered candidate profile, compile the first cover from that profile's Visual DNA and cover role contract without an image reference. After explicit cover approval, the concept may use exactly that same-profile approved candidate as a temporary `bootstrap_reference`; after concept approval, the diagram may use exactly the latest same-profile approved candidate. Every bootstrap reference has `semantic_authority=false`. Never bootstrap from another profile, an article anchor, or unapproved candidate content.

For Style Pack v3, release production additionally requires `prompt_compile_status`, `cross_topic_probe_status`, and `neighbor_discrimination_status` to be `passed`. Otherwise stop with `style_pack_not_qualified`; do not bypass the pack with a legacy or free-form prompt.

Keep three responsibilities separate in the plan and Manifest v2:

- `publication_theme`: page/channel context such as green, dark, or festive; it may influence deterministic page/title layers only;
- `visual_profile`: the selected registered protocol, permanent golden references, and token invariants;
- `asset_semantics`: the article-specific entities, relations, numbers, metaphors, reading order, and claims shown by each asset.

Golden references are visual evidence only. Their example titles, labels, nodes, arrows, numbers, group membership, and fallback paths are never semantic source material. Never infer article-specific nodes or edges from a golden image, even when its subject appears similar to the current article.

For every process, architecture, boundary, comparison, or timeline diagram, the AI must first build an `article-specific semantic graph` from the current article and confirmed sources. Freeze that graph before rendering; the golden diagram may influence only surface, palette, stroke, node geometry, spacing, annotation density, and arrow appearance.

A page theme must not recolor the profile palette, replace its line language, alter its geometry/depth, or turn Style 8 into a green corporate flowchart. Any approved theme override must be listed explicitly in the visual plan and `style.approved_overrides` of Manifest v2. With `theme_override_policy=title-layer-only`, only deterministic `title.*` fields may be overridden.

The selected protocol—not a free-form fingerprint—is the normative source for:

- palette and semantic color roles;
- lighting, contrast, and depth;
- geometry, line language, labels, and arrows;
- material, surface, and texture;
- camera/perspective and spacing;
- required traits, allowed variation, and forbidden traits.

For wide covers, also record two separate composition contracts:

- **wide-canvas occupancy**: how far the intentional foreground hierarchy should extend across the full aspect ratio;
- **crop survival**: the semantic nucleus that must remain meaningful inside alternate crops.

Do not treat a square-safe crop as a container for the complete wide composition. Read the platform-specific occupancy rules before freezing a cover prompt.

Read [references/platform-profiles.md](references/platform-profiles.md) before selecting aspect ratios, title safe zones, or export formats.

### 5. Produce the complete plan and manifest

Before generating anything, present:

1. visual thesis, selected `visual_profile`, and separate `publication_theme`;
2. visual rhythm map;
3. one brief per asset;
4. exact image-generation prompt or deterministic diagram specification;
5. intended heading anchor and placement;
6. known semantic uncertainties;
7. proposed filenames and Markdown paths.

For any cover with deterministic text, also present the final title lines, optional supporting points, text-free background path, and deterministic SVG/HTML source. For a WeChat cover that would be text-free, ask for that choice explicitly before approving the plan.

Each image-generation prompt must specify:

- communicative objective;
- subject and visual metaphor;
- composition and hierarchy;
- selected protocol and approved golden-reference IDs;
- required line/material behavior and semantic palette roles from the protocol;
- aspect ratio and platform safe zone;
- full-width occupancy target and crop-survival contract for wide covers;
- exclusions such as no logos, no watermarks, and no UI gibberish; use `no text` for an image-generated cover background, then deliver approved cover wording through the deterministic layer;
- exact forbidden traits from the selected protocol;
- continuity cues shared with the permanent golden set and planned article anchor.

Each deterministic diagram specification must list:

- nodes with exact labels;
- groups or trust boundaries;
- directed edges with exact meaning;
- sequence or reading order;
- confirmed source for each non-obvious relationship;
- explicitly blocked unconfirmed relationships.

Treat this specification as the semantic graph and source of truth. Assign every node and directed edge a stable ID; record edge type (`primary`, `fallback`, `exception`, or `return`), direction, group membership, and evidence status. Before rendering, reject dangling edges, contradictory directions, invalid shortcuts, and any path that violates a stated invariant. After rendering, compare every visible node, label, boundary, and arrow against the frozen graph. A visually attractive diagram with a topology mismatch fails validation and must be corrected before insertion.

Create Manifest v2 as described in [references/manifest-schema.md](references/manifest-schema.md). Treat it as the source of truth. Record the selected profile/version, Skill-relative protocol and golden-set paths, their current SHA-256 values, the three golden reference IDs, `publication_theme`, override policy, article-specific references, and per-asset `style_validation`. Set approvals to `pending` until the user confirms the plan. After confirmation, freeze prompts/specifications and set the relevant approvals to `approved`.

For a Style Pack v3 imagegen asset, compile the approved brief through `scripts/compile_image_prompt.py` after plan approval and before generating the article style anchor. The model-neutral Prompt IR must contain, in order, `OUTPUT CONTRACT`, `ARTICLE SEMANTICS`, `ROLE COMPOSITION`, `VISUAL DNA`, `REFERENCE CONTRACT`, `TEXT POLICY`, `NEGATIVE CONSTRAINTS`, and `ACCEPTANCE CHECK`. Run preflight lint, store the Prompt IR and GPT Image prompt as UTF-8 files, and record their paths and SHA-256 values together with the three Style Pack contract paths and hashes in Manifest v2. Any lint error stops generation; never delete a failing block, weaken the same-role golden contract, or fall back to a free-form prompt.

End the planning response with one compact approval request. Do not generate images in that response.

### 6. Render through the correct capability

For raster covers and concept illustrations, load and follow the runtime's image-generation skill. Use the approved prompt verbatim except for tool-required syntax. Record any necessary variation back into the manifest before using it.

For every imagegen asset, the default execution policy is `built-in-image-gen` with `model_selection=host-managed`, `api_key_required=false`, and `fallback_approval=not-required`. Call the Codex built-in `image_gen` capability without inventing or passing a model selector when its schema does not expose one. Never switch to CLI/API merely to satisfy a model alias, file-path preference, size preference, batch request, or quality setting. Built-in execution never requires `OPENAI_API_KEY`.

Use `cli-api-fallback` only after the user explicitly asks for or approves that fallback. Record `model_selection=gpt-image-2`, `api_key_required=true`, and `fallback_approval=explicit-user-approved`. If built-in `image_gen` is unavailable or fails, explain that the fallback requires a locally configured API key and stop for explicit approval; do not switch automatically. Record the execution policy in Prompt IR and record the actual execution mode plus the host-returned runtime identity in Manifest v2 when available. If the host returns no runtime identity, store `null`; never infer or fabricate one.

An article style anchor is required for any imagegen asset, any article-specific reference image, or a plan containing more than one deterministic asset. The only `not_required` case is exactly one deterministic asset, no article references, and current matching protocol/golden versions and hashes.

When an article anchor is required:

1. render one representative style anchor, normally the cover or strongest concept image;
2. show it to the user;
3. wait for approval or correction;
4. record its asset ID and set `approvals.article_style_anchor` to `approved`;
5. use the approved article anchor together with the permanent golden references for the remaining assets.

Every remaining imagegen asset must receive the approved golden cover/concept/diagram references that are relevant to its semantic job plus the article anchor. The prompt states which visible properties are invariant: surface, palette roles, stroke/material behavior, geometry, depth, spacing, and forbidden traits. It must also state that any visible example content in a golden reference is non-authoritative and must not be copied. Do not rely on a profile name alone.

For deterministic assets, load the matching token JSON and use an available SVG, HTML, Mermaid, Graphviz, or visualization renderer. Map semantic roles to tokens rather than sampling colors by eye. Export a platform-compatible PNG when SVG support is uncertain, preserve the editable source, and visually compare the result with both the permanent diagram anchor and the approved article anchor.

### 7. Validate every artifact

Inspect each rendered artifact before integration. Mark `validation_status=passed` only if it satisfies all applicable checks:

- matches the approved brief, selected protocol, cited golden references, and article anchor;
- passes every required visual trait and contains none of the protocol's forbidden traits;
- preserves `visual_profile` invariants without `publication_theme` bleed;
- remains visibly continuous with earlier assets in the series across surface, color roles, line/material behavior, geometry, depth, and spacing;
- contains no invented technical relationships;
- labels, arrows, numbers, and boundaries are correct;
- no garbled text, watermark, accidental logo, or obvious generation defect;
- crop and title-safe region work for the target platform;
- a WeChat headline cover contains the exact approved title unless `title.mode=text-free` and `user_opt_out=true`;
- deterministic cover text matches the approved title and supporting points; its text-free background and editable title source both exist;
- every deterministic cover passed a full-width crop check, and WeChat covers also passed a central-square crop check;
- wide-cover foreground occupancy passes the platform profile; square safety has not compressed the complete subject into a small central island;
- body illustrations remain legible at article column width;
- alt text explains the information or purpose, not merely the appearance.

Record the result in Manifest v2 `style_validation`: `status`, cited golden IDs, required-trait result, forbidden traits found, theme bleed, series continuity, v3 `drift_codes` when applicable, and review notes. If an asset fails, regenerate or revise only that asset and validate again. Do not insert a failed asset. For v3, map the failure to the responsible Prompt IR or Style Pack field and recompile; do not rewrite the whole prompt freely.

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

- the selected profile's golden set is missing, candidate, hash-drifted, or not explicitly user-approved (`golden_set_pending`);
- the stored protocol or golden-set identity/version/hash no longer matches the current Skill contract;
- the article changed after plan approval;
- an exact heading or section context no longer matches;
- a diagram depends on an unconfirmed relationship;
- a generated artifact is missing or failed validation;
- a published asset path conflicts with different existing content or any destination collides with the source, manifest, output, or another asset;
- the user asks to overwrite the source without explicitly acknowledging that risk.

Do not recover by guessing a new anchor, silently rewriting prompts, or weakening the validation state.
