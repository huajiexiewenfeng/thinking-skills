# Visual Manifest Schema

`visual-manifest.json` is the only persisted plan between visual planning, rendering, validation, and Markdown integration. Keep it beside the source Markdown so article paths remain relative to one article root without `..` traversal. Style protocol and golden-set paths are Skill-relative and resolve under the `article-visual-director` Skill root.

Manifest v2 is the default for new work. Manifest v1 remains accepted without reinterpretation so existing approved plans continue to validate.

Recommended layout:

```text
article-directory/
├─ article.md
├─ visual-manifest.json
├─ article-illustrated.md
├─ visual-renders/
├─ visual-sources/
└─ assets/article-slug/
```

The scripts use JSON and the Python standard library only.

## Top-Level Fields

| Field | Type | Rule |
|---|---|---|
| `manifest_version` | integer | `2` for new plans; legacy `1` remains accepted |
| `source` | object | Approved source identity and byte format |
| `article_slug` | string | Lowercase ASCII kebab-case |
| `platforms` | array | One or more of `csdn`, `wechat`, `x-article` |
| `outputs` | object | Illustrated Markdown path and published asset directory |
| `style` | object | v1 fingerprint or v2 versioned protocol/golden-set contract |
| `approvals` | object | Plan and version-specific style-anchor gates |
| `integration` | object | Final integration and verification state |
| `assets` | array | Ordered visual plan; IDs and Markdown destinations must be unique |

`outputs.illustrated_markdown` is the requested safe relative `.md` path and must differ from the source. `outputs.actual_illustrated_markdown` starts as `null`; after integration it records the real output, including a `-v2` or later suffix. `outputs.asset_directory` must be `assets/{article_slug}`. Integration uses `pending`, `complete`, or `failed`; verification uses `pending`, `passed`, or `failed`.

## Version 1 Legacy Contract

Version 1 keeps the original `style.profile_id`, free-form `style.fingerprint`, and count-based `approvals.style_anchor` behavior. Fewer than three imagegen assets may use `not_required`; three or more require `approved` during integration. Do not migrate or reinterpret an already approved v1 manifest implicitly.

## Version 2 Style Contract

Version 2 separates publication context from visual identity:

- `publication_theme` describes page or channel context and never replaces the selected profile palette;
- `profile_id` and `profile_version` select one registered visual protocol;
- protocol and golden-set paths plus SHA-256 values freeze the exact approved visual contract;
- `approved_overrides` may only contain deterministic title-layer fields when `theme_override_policy` is `title-layer-only`;
- `article_reference_paths` records article-specific reference images separately from permanent golden anchors;
- `article_style_anchor_asset_id` identifies the approved asset that anchors continuity for this article.

Required v2 `style` object:

```json
{
  "profile_id": "handwritten-systems-explainer",
  "profile_version": 2,
  "protocol_path": "references/styles/08-handwritten-systems-explainer.md",
  "protocol_sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "golden_set_path": "assets/style-anchors/handwritten-systems-explainer/golden-set.json",
  "golden_set_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "golden_reference_ids": ["hse-cover", "hse-concept", "hse-diagram"],
  "publication_theme": "green",
  "theme_override_policy": "title-layer-only",
  "approved_overrides": [],
  "article_reference_paths": [],
  "article_style_anchor_asset_id": "asset-cover"
}
```

The two hashes must equal the current files, and the golden set must be approved with matching profile identity/version and the same three reference IDs.

### Additive Style Pack v3 Traceability

Do not reinterpret an existing Manifest v2 automatically. When, and only when, `style.style_pack_version` equals `3`, the `style` object additionally requires:

```json
{
  "style_pack_version": 3,
  "visual_dna_path": "assets/style-anchors/handwritten-systems-explainer/visual-dna.json",
  "visual_dna_sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  "role_contracts_path": "assets/style-anchors/handwritten-systems-explainer/role-contracts.json",
  "role_contracts_sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
  "reference_matrix_path": "assets/style-anchors/handwritten-systems-explainer/reference-matrix.json",
  "reference_matrix_sha256": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "adapter_id": "gpt-image",
  "adapter_version": 1,
  "prompt_ir_path": "visual-prompts/asset-cover.prompt-ir.json",
  "prompt_ir_sha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  "compiled_prompt_path": "visual-prompts/asset-cover.gpt-image.prompt.md",
  "compiled_prompt_sha256": "1111111111111111111111111111111111111111111111111111111111111111"
}
```

The three Style Pack paths are Skill-relative. Prompt IR and compiled-prompt paths are manifest-relative. Every path must remain inside its declared root, every file must exist, and every SHA-256 must match the exact bytes approved for generation. A v3 failure never falls back to a free-form prompt.

### Article Style Anchor Decision Table

| v2 plan | `approvals.article_style_anchor` | Anchor asset ID |
|---|---|---|
| Any imagegen asset | `approved` | Must name an asset in this manifest |
| Any article-specific reference path | `approved` | Must name an asset in this manifest |
| Two or more deterministic assets | `approved` | Must name an asset in this manifest |
| Protocol or golden-set hash drift | Invalid until refreshed and re-approved | Must be reselected after refresh |
| Exactly one deterministic asset, no references, current hashes | `not_required` permitted | May be `null` |

Every v2 asset also carries a style review:

```json
{
  "style_validation": {
    "status": "planned",
    "golden_reference_ids": ["hse-diagram"],
    "required_traits_passed": false,
    "forbidden_traits_found": [],
    "theme_bleed": false,
    "series_continuity": "planned",
    "drift_codes": [],
    "review_notes": null
  }
}
```

Integration requires `status=passed`, `required_traits_passed=true`, no forbidden traits, `theme_bleed=false`, and `series_continuity=passed`.

For Style Pack v3, `drift_codes` is required and may contain only `PROMPT_BLOCK_MISSING`, `STYLE_IDENTITY_DRIFT`, `ROLE_LAYOUT_DRIFT`, `PUBLICATION_THEME_BLEED`, `GOLDEN_CONTENT_COPY`, `SEMANTIC_TOPOLOGY_DRIFT`, `SERIES_CONTINUITY_DRIFT`, or `TEXT_POLICY_VIOLATION`.

## Source Object

| Field | Rule |
|---|---|
| `path` | Platform-safe Markdown path relative to the manifest |
| `sha256` | SHA-256 of exact source bytes, including BOM and line endings |
| `encoding` | `utf-8` or `utf-8-sig` |
| `line_ending` | `lf` or `crlf` |

Paths reject absolute paths, `..`, control characters, colons, trailing dots/spaces, and Windows device names. At integration time, resolved artifact and editable-source paths must remain below the manifest directory, including through junctions or symlinks.

## Asset Object

| Field | Rule |
|---|---|
| `id` | Stable lowercase kebab-case ID |
| `role` | `cover`, `concept`, `process`, `architecture`, `comparison`, `timeline`, or `chart` |
| `platforms` | Optional non-empty subset of `csdn`, `wechat`, and `x-article`; when omitted, inherits the top-level platforms |
| `reader_takeaway` | What the reader should understand or remember |
| `visual_purpose` | Why this visual earns its place in the article |
| `renderer` | `imagegen`, `deterministic-diagram`, or `deterministic-chart` |
| `output_format` | `png`, `jpg`, `jpeg`, or `svg`; must match the artifact extension |
| `dimensions` | Positive integer `width` and `height` |
| `aspect_ratio` | Numeric `width:height`, for example `16:9` or `2.35:1` |
| `safe_area` | Explicit crop and margin rule |
| `title` | Required for a WeChat `cover`, optional for CSDN/X covers; records deterministic text delivery or an explicit text-free choice |
| `anchor` | Exact heading, one-based occurrence, placement, and section hash |
| `prompt` | Required for `imagegen`; freeze after approval |
| `diagram_spec` | Required for deterministic assets |
| `approval` | Must be `approved` before execution |
| `editable_source_path` | `null` for imagegen; required for deterministic assets |
| `artifact_path` | Validated render relative to the manifest |
| `markdown_path` | Unique published path inside `outputs.asset_directory` |
| `alt` | Useful non-empty alt text |
| `caption` | String or `null` |
| `generation_status` | `planned`, `pending`, `complete`, or `failed` |
| `validation_status` | `planned`, `pending`, `passed`, or `failed` |
| `insertion_status` | `pending`, `inserted`, or `skipped` |

Renderer/role contracts are strict:

- `cover`, `concept` → `imagegen`;
- `process`, `architecture`, `comparison`, `timeline` → `deterministic-diagram`;
- `chart` → `deterministic-chart`.

A deterministic `diagram_spec` includes `nodes`, `edges`, and `blocked_unconfirmed_edges` arrays. Preserve editable SVG, Mermaid, Graphviz, HTML, or equivalent source under `visual-sources/`.

`anchor.placement` is `after_heading` or `section_end`. The latter inserts before the next heading of the same or higher level, or at end of file.

### Cover Title Object

Every asset with `role=cover` whose effective platforms contain `wechat` must include `title`. CSDN and X Article covers may omit it. When any cover includes an exact title or supporting value points, it uses this same deterministic contract. Effective platforms come from `asset.platforms` when present, otherwise from the top-level `platforms`.

Deterministic title delivery is the default:

```json
{
  "mode": "deterministic",
  "text_lines": ["From Skill Memory", "to Shared Agent Knowledge"],
  "supporting_points": ["Deterministic retrieval", "Shared access", "Auditable writes"],
  "editable_source_path": "visual-sources/01-cover-title.svg",
  "background_artifact_path": "visual-renders/01-cover-background.png",
  "user_opt_out": false,
  "wide_crop_checked": false,
  "square_crop_checked": false
}
```

- `text_lines` must contain the exact approved title split into non-empty display lines.
- `supporting_points` is optional. When present, it contains one to four approved, non-empty strings; keep them short enough to remain readable at thumbnail size.
- `editable_source_path` must be a safe relative SVG or HTML path. The editable source must exist before integration.
- `background_artifact_path` must be a safe relative PNG or JPEG path for the text-free image-generation result. It must exist before integration and must differ from the final `artifact_path`.
- `wide_crop_checked` remains `false` during planning and must be `true` before integration for every deterministic cover. `square_crop_checked` must additionally be `true` for WeChat.
- The image-generation prompt may request a text-free background; the final published artifact still includes the deterministic title layer.

A text-free final cover is allowed only after an explicit user choice:

```json
{
  "mode": "text-free",
  "text_lines": [],
  "supporting_points": [],
  "editable_source_path": null,
  "background_artifact_path": null,
  "user_opt_out": true,
  "wide_crop_checked": false,
  "square_crop_checked": false
}
```

Plan approval alone does not count as a text-free opt-out when the choice was not surfaced explicitly.

`anchor.context_sha256` hashes the matched heading through the end of that section. Normalize newlines to LF and remove trailing newlines first. Frontmatter and fenced-code headings do not count.

Generate a context hash:

```powershell
python -c "from pathlib import Path; import sys; sys.path.insert(0, 'skills/article-visual-director/scripts'); from apply_visual_plan import anchor_context_sha256; text=Path('article.md').read_text(encoding='utf-8-sig'); print(anchor_context_sha256(text, '## Runtime Loop', 1))"
```

## Approval Rules

- `approvals.plan` stays `pending` until the complete visual plan is approved.
- Every asset stays `approval=pending` until its prompt or diagram specification is approved.
- In v1, fewer than three `imagegen` assets may use `style_anchor=not_required`; three or more require `style_anchor=approved` for integration.
- In v2, follow the article-style-anchor decision table; the single deterministic asset case is the only `not_required` exception.
- Generation does not imply validation. Inspect the artifact before `validation_status=passed`.
- WeChat cover integration requires a valid `title` contract. Any deterministic cover text requires an existing text-free background, an existing editable source, and a completed wide-crop check; WeChat additionally requires the square-crop check. A declared text-free title contract requires `user_opt_out=true`.
- Only successful Markdown insertion sets every asset to `inserted`, `integration.status=complete`, and `integration.verification_status=passed`.

## Legacy Version 1 Single-Asset Example

```json
{
  "manifest_version": 1,
  "source": {
    "path": "article.md",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "encoding": "utf-8",
    "line_ending": "lf"
  },
  "article_slug": "agent-runtime",
  "platforms": ["csdn", "wechat", "x-article"],
  "outputs": {
    "illustrated_markdown": "article-illustrated.md",
    "actual_illustrated_markdown": null,
    "asset_directory": "assets/agent-runtime"
  },
  "style": {
    "profile_id": "neon-systems",
    "fingerprint": "navy foundation; cyan and acid-green paths; modular glass geometry; generous negative space; no text or HUD clutter"
  },
  "approvals": {
    "plan": "approved",
    "style_anchor": "not_required"
  },
  "integration": {
    "status": "pending",
    "verification_status": "pending"
  },
  "assets": [
    {
      "id": "asset-runtime-loop",
      "role": "concept",
      "reader_takeaway": "Execution remains inside an explicit runtime boundary.",
      "visual_purpose": "Make the runtime control loop memorable.",
      "renderer": "imagegen",
      "output_format": "png",
      "dimensions": {"width": 1600, "height": 900},
      "aspect_ratio": "16:9",
      "safe_area": "Keep essential content outside the outer 8 percent.",
      "anchor": {
        "heading": "## Runtime Loop",
        "occurrence": 1,
        "placement": "section_end",
        "context_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "prompt": "A controlled runtime loop shown as one luminous signal circulating inside explicit modular boundaries; dark technical systems aesthetic; navy, cyan, and acid-green; generous negative space; 16:9; no text, logo, watermark, or HUD clutter",
      "diagram_spec": null,
      "approval": "approved",
      "editable_source_path": null,
      "artifact_path": "visual-renders/02-concept-runtime-loop.png",
      "markdown_path": "assets/agent-runtime/02-concept-runtime-loop.png",
      "alt": "A controlled execution signal loops inside the runtime boundary",
      "caption": null,
      "generation_status": "complete",
      "validation_status": "passed",
      "insertion_status": "pending"
    }
  ]
}
```

## Version 2 Mixed-Renderer Example

The hashes below illustrate the required 64-character shape; a real plan stores hashes computed from the selected protocol and approved golden-set files.

```json
{
  "manifest_version": 2,
  "source": {
    "path": "article.md",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "encoding": "utf-8",
    "line_ending": "lf"
  },
  "article_slug": "ai-amplifies-capability",
  "platforms": ["csdn"],
  "outputs": {
    "illustrated_markdown": "article-illustrated.md",
    "actual_illustrated_markdown": null,
    "asset_directory": "assets/ai-amplifies-capability"
  },
  "style": {
    "profile_id": "handwritten-systems-explainer",
    "profile_version": 2,
    "protocol_path": "references/styles/08-handwritten-systems-explainer.md",
    "protocol_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "golden_set_path": "assets/style-anchors/handwritten-systems-explainer/golden-set.json",
    "golden_set_sha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    "golden_reference_ids": ["hse-cover", "hse-concept", "hse-diagram"],
    "publication_theme": "green",
    "theme_override_policy": "title-layer-only",
    "approved_overrides": [],
    "article_reference_paths": [],
    "article_style_anchor_asset_id": "asset-capability-gap"
  },
  "approvals": {
    "plan": "approved",
    "article_style_anchor": "approved"
  },
  "integration": {
    "status": "pending",
    "verification_status": "pending"
  },
  "assets": [
    {
      "id": "asset-capability-gap",
      "role": "concept",
      "reader_takeaway": "Equal AI multipliers widen the absolute gap between unequal base capabilities.",
      "visual_purpose": "Make 10×100 versus 1×100 memorable.",
      "renderer": "imagegen",
      "output_format": "png",
      "dimensions": {"width": 1600, "height": 900},
      "aspect_ratio": "16:9",
      "safe_area": "Keep the two capability paths inside the outer 8 percent.",
      "anchor": {
        "heading": "## AI 放大的不只是效率",
        "occurrence": 1,
        "placement": "section_end",
        "context_sha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
      },
      "prompt": "Text-free handwritten systems explainer showing two starting capabilities amplified by the same AI multiplier, bold imperfect black ink, warm paper, saturated orange blue and green semantic roles, direct arrows, no pastel corporate cards or 3D",
      "diagram_spec": null,
      "approval": "approved",
      "editable_source_path": null,
      "artifact_path": "visual-renders/01-capability-gap.png",
      "markdown_path": "assets/ai-amplifies-capability/01-capability-gap.png",
      "alt": "Two unequal starting capabilities become a much larger absolute gap after the same AI multiplier",
      "caption": null,
      "generation_status": "planned",
      "validation_status": "planned",
      "insertion_status": "pending",
      "style_validation": {
        "status": "planned",
        "golden_reference_ids": ["hse-cover", "hse-concept"],
        "required_traits_passed": false,
        "forbidden_traits_found": [],
        "theme_bleed": false,
        "series_continuity": "planned",
        "review_notes": null
      }
    },
    {
      "id": "asset-human-ai-loop",
      "role": "process",
      "reader_takeaway": "AI reduces execution cost while human communication remains a separate coordination cost.",
      "visual_purpose": "Separate tool acceleration from collaboration overhead.",
      "renderer": "deterministic-diagram",
      "output_format": "png",
      "dimensions": {"width": 1600, "height": 900},
      "aspect_ratio": "16:9",
      "safe_area": "Keep labels and arrowheads inside the outer 8 percent.",
      "anchor": {
        "heading": "## 为什么越来越多人更愿意和 AI 交流",
        "occurrence": 1,
        "placement": "section_end",
        "context_sha256": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      },
      "prompt": null,
      "diagram_spec": {
        "nodes": [
          {"id": "person", "label": "一个人"},
          {"id": "ai", "label": "AI 执行回路"},
          {"id": "team", "label": "多人沟通"}
        ],
        "edges": [
          {"from": "person", "to": "ai", "label": "低协调成本"},
          {"from": "person", "to": "team", "label": "高沟通成本"}
        ],
        "blocked_unconfirmed_edges": []
      },
      "approval": "approved",
      "editable_source_path": "visual-sources/02-human-ai-loop.svg",
      "artifact_path": "visual-renders/02-human-ai-loop.png",
      "markdown_path": "assets/ai-amplifies-capability/02-human-ai-loop.png",
      "alt": "A person chooses between a direct AI execution loop and a higher-cost human coordination path",
      "caption": null,
      "generation_status": "planned",
      "validation_status": "planned",
      "insertion_status": "pending",
      "style_validation": {
        "status": "planned",
        "golden_reference_ids": ["hse-diagram"],
        "required_traits_passed": false,
        "forbidden_traits_found": [],
        "theme_bleed": false,
        "series_continuity": "planned",
        "review_notes": null
      }
    }
  ]
}
```

For a deterministic asset, set `prompt` to `null`, provide `editable_source_path`, and use a specification such as:

```json
{
  "diagram_spec": {
    "nodes": [
      {"id": "gateway", "label": "Gateway"},
      {"id": "runtime", "label": "Runtime"}
    ],
    "edges": [
      {"from": "gateway", "to": "runtime", "label": "confirmed request handoff"}
    ],
    "blocked_unconfirmed_edges": [
      {"from": "runtime", "to": "gateway", "reason": "return direction is not confirmed"}
    ]
  }
}
```

Do not add an edge merely to make a layout look complete.

## Commands and Result Contracts

Validate an approved plan:

```powershell
python skills/article-visual-director/scripts/validate_manifest.py --manifest visual-manifest.json --phase plan
```

Validate integration readiness:

```powershell
python skills/article-visual-director/scripts/validate_manifest.py --manifest visual-manifest.json --phase integration
```

Success is JSON with `"overall": "passed"`, the requested phase, and an empty errors array. Validation failures return `"overall": "failed"` and exit non-zero.

Create the configured illustrated output:

```powershell
python skills/article-visual-director/scripts/apply_visual_plan.py --manifest visual-manifest.json
```

Explicit interface:

```powershell
python skills/article-visual-director/scripts/apply_visual_plan.py --manifest visual-manifest.json --source article.md --out article-illustrated.md
```

If the requested output exists, the script chooses `-v2`, `-v3`, and so on. Passing the same source and output fails unless `--allow-source-overwrite` is explicitly present. The skill workflow must not use that escape hatch.

## Integration Markers

Each insertion uses exact paired marker lines:

```markdown
<!-- article-visual:start asset-runtime-loop -->
![A controlled execution signal loops inside the runtime boundary](assets/agent-runtime/02-concept-runtime-loop.png)
<!-- article-visual:end asset-runtime-loop -->
```

All planned asset pairs present means `unchanged`. Some, malformed, duplicated, or misordered pairs mean `partial_integration`; the script stops before digest comparison or writes. Marker-like text in frontmatter or fenced code does not count.
