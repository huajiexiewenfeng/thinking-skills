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

## Task continuity and requested scope

For maintenance of this Skill, inspect and repair its instructions or scripts; do not start image production or show the style menu.

Within the same ongoing article task, preserve explicit style selection, plan approval, and anchor approval across follow-up messages. A short reply such as “4”, “可以”, or “非常好” applies to the immediately preceding choice or review when unambiguous. Do not restart the menu or ask again for an unchanged approved step. A new article or a changed, unreviewed plan still needs its applicable gates.

When the user requests only a cover, keep the plan to one cover. Read enough of the article to establish accurate semantics, but do not require a body-illustration density audit or propose additional assets. Preserve style, plan, and anchor review gates. The finished cover itself is the article anchor; approval does not require generating another image. Deliver the cover, editable source, prompt, and validation record. Markdown integration is outside this scope unless requested; do not describe it as unfinished work. Do not invent manifest enum values or claim integration passed when it was not run. The full article workflow below applies when body illustrations or integration are requested.

## Portable command execution

Resolve the loaded Skill root and an actual Python interpreter before running scripts. Prefer the host's workspace-dependency discovery capability when available. Verify the returned executable with `--version`; a Windows `python` alias returning a nonzero exit code or no version is not a working runtime. Do not hardcode another machine's runtime path or install a runtime without first checking available interpreters.

Use the resolved executable with `-B -X utf8` for every command below. In PowerShell use `& $visualPython -B -X utf8 <script> <arguments>`, where `$visualPython` is the verified absolute executable path. Set the command's output decoding to UTF-8 where supported. Write Chinese prompts and structured requests directly to UTF-8 files; avoid embedding article wording, typographic quotes, or multiline JSON in shell command strings. Do not change global console or system encoding.

After selecting a registered Style 1–9, use `scripts/validate_style_contract.py --phase release --profile <selected-profile> --skill-root <loaded-skill-root>` as the contract check. Style 10 is not a registered profile: do not call this validator for `article-local-freeform`; validate its exploring/locked state through `scripts/validate_manifest.py` and the article-local brief instead. The registered-style validator's `portable_hash.py` helper already handles permitted text LF/CRLF differences. Do not replace it with raw-hash-only comparisons, create a normalized copy of the Skill to bypass it, or rewrite expected hashes to make validation pass. Binary assets and source-integrity checks retain their strict hashing rules. If the applicable validator still reports content drift, report the specific files and stop the affected generation step.

## Non-Negotiable State Machine

```text
inspect article
  -> present the nine registered bilingual profiles plus the article-local freeform mode
  -> wait for explicit style selection
  -> select Sparse, Balanced, or Chapter-led density
  -> audit every substantive section and derive the asset count
  -> branch: for Styles 1–9, load selected protocol and approved golden set; for Style 10, establish its article-local direction
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

Every new article-image task must present this complete menu before producing the visual plan or calling an image-generation capability:

Before rendering the menu, resolve the loaded Skill's absolute root and run its read-only preview resolver:

```powershell
python <loaded-skill-root>/scripts/list_style_previews.py --skill-root <loaded-skill-root>
```

This is a narrow pre-selection exception: load the registry and golden cover metadata only. Do not load any profile protocol, token file, Visual DNA, role contract, reference matrix, adapter contract, or non-cover golden asset before selection. Render one verified golden cover immediately after each registered Style 1–9 using the resolver record with the matching ordinal. Use a host-native Markdown image whose target is the returned absolute local filesystem path. If that record has `status=unavailable`, render `黄金图暂不可用` below the Style instead. For Style 10, render only its dynamic preview note. Do not substitute another role, another Style, a candidate, an unverified file, or a newly generated image.

1. **Technical Editorial Minimal（技术编辑简约）** — 适合技术教程和解释型文章，几何清晰、留白克制。
2. **White-Green Editorial Minimal（白底绿色编辑简约）** — 适合微信公众号 AI 与产业分析，白底绿色、明亮理性。
3. **Neon Systems（霓虹系统科技）** — 深色底配青绿霓虹，适合 Agent、基础设施和高能科技主题。
4. **Polished Tech Explainer（质感科技图解）** — 冷白网格、钴蓝系统逻辑、玻璃科技质感与丰富信息层，适合 AI 系统、产品架构、技术流程和发布级科技图解。
5. **Isometric Infrastructure（等距基础设施）** — 等距模块化空间，适合云服务、部署体系和数据管线。
6. **Cinematic Conceptual（电影感概念视觉）** — 单一强隐喻配合克制的戏剧光影，适合战略与哲学议题。
7. **Soft Technical Sketch（柔和技术手绘）** — 纸张、墨线和淡彩质感，适合教程、入门内容和亲和解释。
8. **Handwritten Systems Explainer（手写系统解释图）** — 米白纸面、手绘框线和少量高亮色，适合解释 Agent、Runtime、检索边界与前后对比。
9. **Technical Explainer Infographic（技术原理图解）** — 白底蓝绿、清晰文字与技术图标，按内容采用分层机制、多列架构或阶段流程；允许克制的局部图标质感，适合技术原理、系统架构和工程交付说明。
10. **Freeform Art Direction（自由定调）** — 不使用固定黄金图；AI 根据当前文章自由创造视觉方向，首张确认后锁定为整篇文章的临时风格。选择此项后必须读取 [references/freeform-art-direction.md](references/freeform-art-direction.md)。

Use this response shape:

```text
请选择本次配图风格（回复序号、英文名或中文名均可）：
[Style 1 bilingual description]
![1. English Name 黄金图](<absolute local filesystem path>)
...
[Style 9 bilingual description]
![9. English Name 黄金图](<absolute local filesystem path>)
[Style 10 bilingual description]
每篇文章动态生成，不设固定黄金图
推荐：N. English Name（中文名）— one sentence tied to this article.
```

For an unavailable registered record, replace only that Style's image line with `黄金图暂不可用`. For the dynamic record, render its `preview_note` and never invent an image path or permanent golden. Keep all ten choices in ordinal order.

When a preview record has `qualification_status=pending`, retain the verified cover but append `参考图已确认；制作验证待完成` and name the pending checks. `recorded_passed` means metadata records passed checks, not that a fresh release validation ran. Do not label a style production-ready from the cover preview alone. Explain this state before the user selects, and keep the existing post-selection release validator.

After inspecting an available article, mark one item as the recommendation but still show all ten. If the article is not yet available, show the menu without a recommendation. If the user named a style in the invoking message, show all ten, mark that item as their current choice, and ask them to confirm it or select another. Do not infer approval from a past invocation or a previous article.

Stop after the menu and wait for an explicit selection. Do not produce the visual plan, freeze prompts, create a manifest, or call image generation before the selection arrives. Style selection approves only the visual submode; the later plan and style-anchor gates still apply.

## Workflow

### 1. Inspect the source without changing it

Read the Markdown and record:

- source path and whole-file SHA-256;
- UTF-8 versus UTF-8 BOM;
- LF versus CRLF;
- frontmatter boundaries;
- heading hierarchy and existing images;
- existing tables, formulas, fenced code blocks, quotations, and other reading aids, recorded separately from image coverage;
- target platform: `csdn`, `wechat`, `x-article`, or a combination;
- article thesis, audience, tone, and the role and visual need of every substantive section.

If the source file or target platform is missing and cannot be discovered, ask one short question. Otherwise recommend a default and continue.

For technical content, create a compact semantic ledger:

- **confirmed**: explicitly stated or verified from source material;
- **simplification**: visually compressed but semantically faithful;
- **unconfirmed**: must not appear as a factual connection until the user confirms it.

### 2. Obtain explicit style selection

Apply the Mandatory Style Selection Gate. Present the complete bilingual menu and stop until the user explicitly selects one submode. No visual-rhythm decisions or other plan work begin before this selection.

### 3. Choose a coverage-aware visual rhythm

Select a visual-density mode before proposing an asset count. Use this selection priority:

1. a user-explicit density or coverage requirement;
2. an approved reference, platform convention, or visual direction;
3. article type, length, section structure, and comprehension difficulty;
4. when no stronger signal exists, Balanced is the default.

Use one of these modes:

- **Sparse** — For short articles, announcements, compact opinion pieces, or a tightly concentrated argument. Audit every substantive section, but allow short adjacent sections to share an asset or use `none` when the rationale is explicit.
- **Balanced** — The default. Evaluate every substantive section and give important concepts, comparisons, processes, and structural turns visual support. It need not produce one image per section, but it must not leave several consecutive important sections without visual support and an explicit reason.
- **Chapter-led** — For long-form teaching, explanatory, or research-oriented articles whose major sections carry distinct conceptual jobs; for image-dense references the user explicitly approves; or whenever the user asks for section-level image coverage. Give every major substantive section a visual entry by default. Adjacent sections may share only when they express one clear visual proposition; a section may use `none` only when an image would add no understanding or would duplicate another asset. This is not a mechanical image for every minor heading, transition, or CTA.

Before proposing an asset count, audit every substantive section. Use this table in the visual plan:

| Section | Role | Visual need | Coverage | Asset role | Rationale |
|---|---|---|---|---|---|
| Stable heading or section ID | Conflict, distinction, model, evidence, transition, or another argument role | What a visual helps the reader understand or remember | One coverage state below | Comparison, process, concept, diagnosis, bridge, or another semantic job | Why this coverage is sufficient |

Coverage states have these exact meanings:

- `dedicated`: the section has its own image.
- `shared`: the section shares an image with an adjacent section that expresses the same visual proposition; name the paired sections and that shared proposition.
- `existing-aid`: the section already has a table, formula, code block, screenshot, or other non-image reading aid.
- `none`: no image is planned; explain why an image would not improve understanding or would be repetitive.

Re-audit the rhythm when two or more consecutive important sections are `none` or only `existing-aid`, and flag that long text-only run explicitly in the plan. In Chapter-led, `existing-aid` does not satisfy a user-explicit request for a section image.

The asset count is an output of the coverage audit, not an input to it:

- There is no hard maximum image count.
- Do not use a fixed images-per-word ratio or another numeric quota in place of editorial judgment.
- Count the cover separately; it does not replace a body section's visual entry.
- Tables, formulas, and code blocks are reading aids, but they do not automatically satisfy an explicit request for section images.
- One asset may cover multiple adjacent sections only when it has one coherent shared visual proposition.
- Merge or remove assets that merely repeat the same conclusion.

### Default image placement

For each image selected for a new plan, default `anchor.placement` to `after_heading`: **heading -> image -> optional caption -> body prose**. This applies across density modes and language editions; it does not require an image for every heading. Place a cover after the article title and a body image after its corresponding section heading.

If the user specifies another position, preserve that choice. A proposed `section_end` placement must have an explicit rationale in the visual plan and be approved as an exception. Keep already approved placements when reusing an existing plan; move them only when the user requests or approves the change.

Use this renderer rule:

| Need | Renderer | Reason |
|---|---|---|
| Mood, metaphor, editorial cover, abstract concept | `imagegen` | Composition and atmosphere matter more than exact topology |
| Flow, architecture, boundary, comparison, timeline | `deterministic-diagram` | Nodes, labels, edges, and direction must be exact |
| Quantitative relationship backed by data | `deterministic-chart` | Values and scales must be reproducible |

Never send dense technical labels, source code, or a multi-step architecture to an image model by default. If a cover needs an exact title, generate the background without text and add title typography with a deterministic SVG/HTML layer.

### Closed copy and explicit relations

For native-copy generation, `exact_text` is the complete allowed visible inventory. Prompt explanations, reference captions, automatically added subtitles, legends and node descriptions must not become visible copy. Keep notes distinct from graph nodes. A cover or concept containing directed technical relationships needs a frozen graph too; role names do not exempt arrows from semantic review. Compiler success validates the request, not the generated output. Preserve failed outputs and use targeted regeneration or the allowed deterministic rebuild when native copy or topology fails; never update qualification flags from compilation alone.

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

For Styles 1–9, read [references/style-registry.json](references/style-registry.json), locate the exact selected profile, then read only that entry's protocol, token file, and golden-set metadata. If that entry declares `style_pack_version=3`, also load its Visual DNA, role contracts, reference matrix, and registered adapter contract. Do not load or blend the other eight registered protocols. Explain the selected mode's fit in terms of audience, article tone, technical density, and platform—not taste alone.

For `article-local-freeform`, follow [references/freeform-art-direction.md](references/freeform-art-direction.md). It is an article-scoped mode, not a registered profile: it has no permanent golden, global protocol, qualification state, or cross-article inheritance. The first approved anchor freezes an article-local visual brief for all remaining assets. Visual freedom never authorizes invented article facts, copy, nodes, arrows, numbers, boundaries, sequences, or causal relationships.

For Styles 1–9, the selected golden set must have `status=approved`, explicit user approval, and exactly three verified anchors: cover, concept, and diagram style anchor. If it is missing or still `candidate`, stop article production with `golden_set_pending`. Explain that this registered visual mode has no approved permanent style anchors yet and enter the golden-production flow only after the user agrees. Golden-production order is cover, concept, then architecture/process style anchor; candidates become golden only after explicit user approval and release validation. This permanent-golden gate does not apply to Style 10.

In golden production for a registered candidate profile, compile the first cover from that profile's Visual DNA and cover role contract without an image reference. After explicit cover approval, the concept may use exactly that same-profile approved candidate as a temporary `bootstrap_reference`; after concept approval, the diagram may use exactly the latest same-profile approved candidate. Every bootstrap reference has `semantic_authority=false`. Never bootstrap from another profile, an article anchor, or unapproved candidate content.

For Style Pack v3, release production additionally requires `prompt_compile_status`, `cross_topic_probe_status`, and `neighbor_discrimination_status` to be `passed`. Otherwise stop with `style_pack_not_qualified`; do not bypass the pack with a legacy or free-form prompt.

Keep three responsibilities separate in the plan and Manifest v2:

- `publication_theme`: page/channel context such as green, dark, or festive; it may influence deterministic page/title layers only;
- `visual_profile`: either the selected registered protocol/permanent anchors/token invariants, or Style 10's frozen article-local visual brief and approved anchor;
- `asset_semantics`: the article-specific entities, relations, numbers, metaphors, reading order, and claims shown by each asset.

Registered golden references and Style 10 article references are visual evidence only. Their example titles, labels, nodes, arrows, numbers, group membership, and fallback paths are never semantic source material. Never infer article-specific nodes or edges from a reference image, even when its subject appears similar to the current article.

For every process, architecture, boundary, comparison, or timeline diagram, the AI must first build an `article-specific semantic graph` from the current article and confirmed sources. Freeze that graph before rendering; a registered golden diagram or Style 10's approved article anchor may influence only surface, palette, stroke, node geometry, spacing, annotation density, and arrow appearance.

A page theme must not recolor the profile palette, replace its line language, alter its geometry/depth, or turn Style 8 into a green corporate flowchart. Any approved theme override must be listed explicitly in the visual plan and `style.approved_overrides` of Manifest v2. With `theme_override_policy=title-layer-only`, only deterministic `title.*` fields may be overridden.

For Styles 1–9, the selected protocol—not a free-form fingerprint—is the normative source for the following properties. For Style 10, the locked article-local visual brief is the normative source for the same properties:

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
2. selected visual-density mode and the evidence for that choice;
3. the complete section coverage table;
4. separate cover and body-image totals derived from the audit;
5. visual rhythm map, including shared-section propositions, `none` rationales, and any long text-only-run warning;
6. one brief per asset;
7. exact image-generation prompt or deterministic diagram specification;
8. intended heading anchor and placement;
9. known semantic uncertainties;
10. proposed filenames and Markdown paths.

For any cover with deterministic text, also present the final title lines, optional supporting points, text-free background path, and deterministic SVG/HTML source. For a WeChat cover that would be text-free, ask for that choice explicitly before approving the plan.

Each image-generation prompt must specify:

- communicative objective;
- subject and visual metaphor;
- composition and hierarchy;
- the applicable visual contract: selected protocol and approved golden-reference IDs for Styles 1–9; for Style 10's first asset, the approved proposed direction and candidate anchor ID; after anchor approval, the frozen article-local brief and approved anchor ID;
- required line/material behavior and semantic palette roles from that contract;
- aspect ratio and platform safe zone;
- full-width occupancy target and crop-survival contract for wide covers;
- exclusions such as no logos, no watermarks, and no UI gibberish; use `no text` for an image-generated cover background, then deliver approved cover wording through the deterministic layer;
- exact forbidden traits from the applicable contract;
- continuity cues shared with the registered golden set plus article anchor, or with Style 10's article-local anchor alone.

Each deterministic diagram specification must list:

- nodes with exact labels;
- groups or trust boundaries;
- directed edges with exact meaning;
- sequence or reading order;
- confirmed source for each non-obvious relationship;
- explicitly blocked unconfirmed relationships.

Treat this specification as the semantic graph and source of truth. Assign every node and directed edge a stable ID; record edge type (`primary`, `fallback`, `exception`, or `return`), direction, group membership, and evidence status. Before rendering, reject dangling edges, contradictory directions, invalid shortcuts, and any path that violates a stated invariant. After rendering, compare every visible node, label, boundary, and arrow against the frozen graph. A visually attractive diagram with a topology mismatch fails validation and must be corrected before insertion.

Create Manifest v2 as described in [references/manifest-schema.md](references/manifest-schema.md) and treat it as the source of truth. For Styles 1–9, record the selected profile/version, Skill-relative protocol/golden paths and hashes, and three golden IDs. For Style 10, record `selection_mode=freeform`, `freeform_state=exploring`, the article-bound direction identity, candidate anchor ID, and no permanent contract fields; after the first artifact is explicitly approved, freeze the article-local brief and anchor hashes and change the state to `locked`. In both branches, record `publication_theme`, override policy, article-specific references, and per-asset validation. Plan approval and rendered-anchor approval are separate: approving the plan does not lock an unseen Style 10 anchor.

For a Style Pack v3 imagegen asset, compile the approved brief through `scripts/compile_image_prompt.py` after plan approval and before generating the article style anchor. The model-neutral Prompt IR must contain, in order, `OUTPUT CONTRACT`, `ARTICLE SEMANTICS`, `ROLE COMPOSITION`, `VISUAL DNA`, `REFERENCE CONTRACT`, `TEXT POLICY`, `NEGATIVE CONSTRAINTS`, and `ACCEPTANCE CHECK`. Run preflight lint, store the Prompt IR and GPT Image prompt as UTF-8 files, and record their paths and SHA-256 values together with the three Style Pack contract paths and hashes in Manifest v2. Any lint error stops generation; never delete a failing block, weaken the same-role golden contract, or fall back to a free-form prompt.

End the planning response with one compact approval request. Do not generate images in that response.

### 6. Render through the correct capability

For raster covers and concept illustrations, load and follow the runtime's image-generation skill. Use the approved prompt verbatim except for tool-required syntax. Record any necessary variation back into the manifest before using it.

For Styles 1–9, an article style anchor is required for any imagegen asset, any article-specific reference image, or a plan containing more than one deterministic asset. Their only `not_required` case is exactly one deterministic asset, no article references, and current matching protocol/golden versions and hashes. Style 10 always names its first representative asset as the candidate anchor, including a one-asset deterministic plan; it cannot integrate until that artifact is approved and the article-local direction is locked.

When an article anchor is required:

1. render one representative style anchor, normally the cover or strongest concept image;
2. show it to the user;
3. wait for approval or correction;
4. record its asset ID and set `approvals.article_style_anchor` to `approved`;
5. for Styles 1–9, use the approved article anchor together with relevant permanent goldens; for Style 10, use the approved article anchor together with the frozen article-local brief and no permanent goldens.

For Styles 1–9, every remaining imagegen asset must receive the approved same-profile golden references relevant to its semantic job plus the article anchor. For Style 10, every remaining imagegen asset must receive the approved article anchor and frozen article-local brief; it must not cite permanent golden IDs. In both branches, the prompt states which visible properties are invariant: surface, palette roles, stroke/material behavior, geometry, depth, spacing, and forbidden traits. It must also state that visible example content is non-authoritative and must not be copied. Do not rely on a profile or direction name alone.

Read the actual generated pixel dimensions before preparing an export. A requested aspect ratio is not proof of the returned ratio. Preserve proportions when fitting the target canvas: use a reviewed crop or padding, or use the image tool for outpainting where needed. Never force a mismatched background to the target dimensions with non-uniform scaling or SVG `preserveAspectRatio="none"`. Recheck title and subject survival in the wide and central-square crops after fitting. Prefer exporting the final PNG from the editable typography source so the delivered source and raster agree.

For deterministic assets, use an available SVG, HTML, Mermaid, Graphviz, or visualization renderer. Styles 1–9 load the matching token JSON and compare against the permanent diagram anchor plus article anchor. Style 10 derives deterministic tokens from the locked article-local brief and compares only against its approved article anchor. Map semantic roles to the applicable tokens rather than sampling colors by eye. Export a platform-compatible PNG when SVG support is uncertain and preserve the editable source.

### 7. Validate every artifact

Inspect each rendered artifact before integration. Mark `validation_status=passed` only if it satisfies all applicable checks:

- matches the approved asset brief and applicable visual contract: registered protocol/goldens/article anchor, or Style 10 article-local brief/anchor;
- passes every required visual trait and contains none of the applicable contract's forbidden traits;
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

Record the result in Manifest v2 `style_validation`: `status`, required-trait result, forbidden traits found, theme bleed, series continuity, v3 `drift_codes` when applicable, and review notes. Styles 1–9 record cited golden IDs; Style 10 records an empty continuity list for the anchor and exactly its approved anchor ID for every later asset. If an asset fails, regenerate or revise only that asset and validate again. Do not insert a failed asset. For v3, map the failure to the responsible Prompt IR or Style Pack field and recompile; do not rewrite the whole prompt freely.

### 8. Integrate non-destructively

Skip this step for a cover-only delivery unless the user also requested insertion.

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

When Markdown integration is requested, the skill workflow must always use a new illustrated copy. The low-level `--allow-source-overwrite` escape hatch exists for explicit operator-controlled recovery and must never be inferred from a general request to insert images.

After integration, verify each image block's actual position against its approved anchor and placement. For `after_heading`, the image and optional caption must precede the section's first body paragraph. Existing markers or a valid placement value alone do not prove correct placement.

### 9. Hand off the result

For cover-only delivery, inspect the actual exported cover and record the applicable checks from step 7 before handing it off. Do not mark visual checks passed merely because rendering exited successfully.

Report:

- illustrated Markdown path when integration was requested; otherwise the final cover path;
- manifest path;
- generated and deterministic source asset paths;
- which assets passed validation;
- any platform caveats or unresolved semantic decisions;
- confirmation that the source was unchanged.

## Failure Rules

Stop and explain the blocking evidence when:

- for Styles 1–9, the selected profile's golden set is missing, candidate, hash-drifted, or not explicitly user-approved (`golden_set_pending`);
- for Styles 1–9, the stored protocol or golden-set identity/version/hash no longer matches the current Skill contract;
- for Style 10, the first anchor is unapproved, the direction is not locked, the article-local brief is missing, or its brief/anchor/source hash has drifted;
- the article changed after plan approval;
- an exact heading or section context no longer matches;
- a diagram depends on an unconfirmed relationship;
- a generated artifact is missing or failed validation;
- a published asset path conflicts with different existing content or any destination collides with the source, manifest, output, or another asset;
- the user asks to overwrite the source without explicitly acknowledging that risk.

Do not recover by guessing a new anchor, silently rewriting prompts, or weakening the validation state.
