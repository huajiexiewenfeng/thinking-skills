# Visual Manifest Schema

`visual-manifest.json` is the only persisted plan between visual planning, rendering, validation, and Markdown integration. Keep it beside the source Markdown so every path remains relative to one article root without `..` traversal.

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
| `manifest_version` | integer | Must be `1` |
| `source` | object | Approved source identity and byte format |
| `article_slug` | string | Lowercase ASCII kebab-case |
| `platforms` | array | One or both of `csdn`, `wechat` |
| `outputs` | object | Illustrated Markdown path and published asset directory |
| `style` | object | Approved profile and reusable fingerprint |
| `approvals` | object | Plan and style-anchor gates |
| `integration` | object | Final integration and verification state |
| `assets` | array | Ordered visual plan; IDs and Markdown destinations must be unique |

`outputs.illustrated_markdown` is the requested safe relative `.md` path and must differ from the source. `outputs.actual_illustrated_markdown` starts as `null`; after integration it records the real output, including a `-v2` or later suffix. `outputs.asset_directory` must be `assets/{article_slug}`. Integration uses `pending`, `complete`, or `failed`; verification uses `pending`, `passed`, or `failed`.

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
| `reader_takeaway` | What the reader should understand or remember |
| `visual_purpose` | Why this visual earns its place in the article |
| `renderer` | `imagegen`, `deterministic-diagram`, or `deterministic-chart` |
| `output_format` | `png`, `jpg`, `jpeg`, or `svg`; must match the artifact extension |
| `dimensions` | Positive integer `width` and `height` |
| `aspect_ratio` | Numeric `width:height`, for example `16:9` or `2.35:1` |
| `safe_area` | Explicit crop and margin rule |
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

`anchor.context_sha256` hashes the matched heading through the end of that section. Normalize newlines to LF and remove trailing newlines first. Frontmatter and fenced-code headings do not count.

Generate a context hash:

```powershell
python -c "from pathlib import Path; import sys; sys.path.insert(0, 'skills/article-visual-director/scripts'); from apply_visual_plan import anchor_context_sha256; text=Path('article.md').read_text(encoding='utf-8-sig'); print(anchor_context_sha256(text, '## Runtime Loop', 1))"
```

## Approval Rules

- `approvals.plan` stays `pending` until the complete visual plan is approved.
- Every asset stays `approval=pending` until its prompt or diagram specification is approved.
- Fewer than three `imagegen` assets may use `style_anchor=not_required`.
- Three or more `imagegen` assets require `style_anchor=approved` for integration.
- Generation does not imply validation. Inspect the artifact before `validation_status=passed`.
- Only successful Markdown insertion sets every asset to `inserted`, `integration.status=complete`, and `integration.verification_status=passed`.

## Complete Single-Asset Example

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
  "platforms": ["csdn", "wechat"],
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
