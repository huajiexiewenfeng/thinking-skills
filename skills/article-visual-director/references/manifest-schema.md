# Visual Manifest Schema

The manifest is the source of truth between planning, rendering, validation, and Markdown integration. Store it beside the source Markdown by default as `visual-manifest.json`; if a directory contains multiple articles, use an article-specific directory or an explicit manifest filename while keeping all paths correctly relative to the manifest.

The scripts use JSON and Python standard library only.

## Top-Level Fields

| Field | Type | Rule |
|---|---|---|
| `manifest_version` | integer | Must be `1` |
| `source` | object | Approved source identity and byte format |
| `article_slug` | string | Lowercase ASCII kebab-case |
| `platforms` | array | One or both of `csdn`, `wechat` |
| `style` | object | Approved profile and reusable fingerprint |
| `approvals` | object | Plan and style-anchor gates |
| `assets` | array | Ordered visual plan; IDs must be unique |

## Source Object

| Field | Rule |
|---|---|
| `path` | Safe path relative to the manifest |
| `sha256` | SHA-256 of the exact source bytes, including BOM and line endings |
| `encoding` | `utf-8` or `utf-8-sig` |
| `line_ending` | `lf` or `crlf` |

## Asset Object

| Field | Rule |
|---|---|
| `id` | Stable lowercase kebab-case ID |
| `role` | `cover`, `concept`, `process`, `architecture`, `comparison`, `timeline`, or `chart` |
| `renderer` | `imagegen`, `deterministic-diagram`, or `deterministic-chart` |
| `anchor` | Exact heading, occurrence, placement, and section context hash |
| `prompt` | Required for `imagegen`; freeze after approval |
| `diagram_spec` | Required for deterministic assets |
| `approval` | Must be `approved` before execution |
| `artifact_path` | Validated render relative to the manifest |
| `markdown_path` | Published asset path relative to the source Markdown |
| `alt` | Useful non-empty alt text |
| `caption` | String or `null` |
| `generation_status` | `planned`, `pending`, `complete`, or `failed` |
| `validation_status` | `planned`, `pending`, `passed`, or `failed` |
| `insertion_status` | `pending`, `inserted`, or `skipped` |

`anchor.placement` is either:

- `after_heading`: insert directly after the matched heading;
- `section_end`: insert before the next heading of the same or higher level, or at end of file.

`anchor.context_sha256` is computed from the matched heading through the end of that section. Newlines are normalized to LF and trailing newlines are removed before hashing. Headings inside frontmatter or fenced code blocks do not count.

Generate a context hash from Python:

```powershell
python -c "from pathlib import Path; import sys; sys.path.insert(0, 'skills/article-visual-director/scripts'); from apply_visual_plan import anchor_context_sha256; text=Path('article.md').read_text(encoding='utf-8-sig'); print(anchor_context_sha256(text, '## Runtime Loop', 1))"
```

## Approval Rules

- `approvals.plan` remains `pending` until the user approves the complete visual plan.
- Every asset's `approval` remains `pending` until its prompt or deterministic spec is approved.
- With fewer than three `imagegen` assets, `approvals.style_anchor` may be `not_required`.
- With three or more `imagegen` assets, integration requires `approvals.style_anchor=approved`.
- Generation does not imply validation. Inspect the artifact before setting `validation_status=passed`.

## Minimal Example

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
  "style": {
    "profile_id": "neon-systems",
    "fingerprint": "navy foundation; cyan and acid-green paths; modular glass geometry; generous negative space; no text or HUD clutter"
  },
  "approvals": {
    "plan": "approved",
    "style_anchor": "not_required"
  },
  "assets": [
    {
      "id": "asset-runtime-loop",
      "role": "concept",
      "renderer": "imagegen",
      "anchor": {
        "heading": "## Runtime Loop",
        "occurrence": 1,
        "placement": "section_end",
        "context_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "prompt": "A controlled runtime loop shown as one luminous signal circulating inside explicit modular boundaries; dark technical systems aesthetic; navy, cyan, and acid-green; generous negative space; 16:9; no text, logo, watermark, or HUD clutter",
      "approval": "approved",
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

For a deterministic asset, replace `prompt` with a structured specification such as:

```json
{
  "diagram_spec": {
    "nodes": [
      {"id": "gateway", "label": "Gateway"},
      {"id": "runtime", "label": "Runtime"},
      {"id": "approval", "label": "Tool Approval"},
      {"id": "result", "label": "Result"}
    ],
    "edges": [
      {"from": "gateway", "to": "runtime", "label": "confirmed request handoff"}
    ],
    "boundaries": [],
    "blocked_unconfirmed_edges": [
      {"from": "approval", "to": "result", "reason": "article does not state whether rejection returns a result"}
    ]
  }
}
```

Do not turn an inference into an edge merely to make the layout look complete.

## Validation Commands

Planning contract:

```powershell
python skills/article-visual-director/scripts/validate_manifest.py --manifest visual-manifest.json --phase plan
```

Integration contract:

```powershell
python skills/article-visual-director/scripts/validate_manifest.py --manifest visual-manifest.json --phase integration
```

The validator prints structured JSON and exits non-zero on failure.

## Integration Markers

The apply script surrounds each inserted visual with stable markers:

```markdown
<!-- article-visual:asset-runtime-loop:start -->
![A controlled execution signal loops inside the runtime boundary](assets/agent-runtime/02-concept-runtime-loop.png)
<!-- article-visual:asset-runtime-loop:end -->
```

These markers are part of the idempotency contract. Do not remove or duplicate them in an illustrated copy.
