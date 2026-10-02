[OUTPUT CONTRACT]
{
  "platform": "wechat",
  "aspect_ratio": "16:9",
  "occupancy": "content-led spacing; readable labels with no fixed fill quota",
  "crop_rules": "preserve all approved copy and semantic relationships within the requested export; do not shrink labels to fill a crop",
  "output_count": 1
}

[ARTICLE SEMANTICS]
{
  "confirmed": [
    "An event moves from a source through intake and validation before processing.",
    "Accepted processing writes an audit record.",
    "Rejected validation routes to a dead-letter state, which may pass through replay approval and return to intake."
  ],
  "simplifications": [
    "Use exactly seven nodes and seven directed edges.",
    "Represent replay approval as one bounded gate without retry counts, schedules, or operator identities."
  ],
  "blocked": [
    "Do not add brokers, databases, consumers, notification nodes, vendors, protocols, batch sizes, timing, or automatic replay guarantees.",
    "Do not omit, duplicate, reverse, merge, or invent any frozen node or edge.",
    "Do not add a successful-only condition to audit records. No subtitle or node descriptions. Only exact_text is visible; no extra 路径说明 or 关键约束 headings."
  ],
  "frozen_graph": {
    "nodes": [
      "event-source",
      "intake",
      "validation",
      "processing",
      "audit-record",
      "dead-letter",
      "replay-approval"
    ],
    "edges": [
      {
        "id": "edge-source-intake",
        "from": "event-source",
        "to": "intake",
        "type": "primary"
      },
      {
        "id": "edge-intake-validation",
        "from": "intake",
        "to": "validation",
        "type": "primary"
      },
      {
        "id": "edge-validation-processing",
        "from": "validation",
        "to": "processing",
        "type": "primary"
      },
      {
        "id": "edge-processing-audit",
        "from": "processing",
        "to": "audit-record",
        "type": "primary"
      },
      {
        "id": "edge-validation-dead-letter",
        "from": "validation",
        "to": "dead-letter",
        "type": "exception"
      },
      {
        "id": "edge-dead-letter-replay",
        "from": "dead-letter",
        "to": "replay-approval",
        "type": "exception"
      },
      {
        "id": "edge-replay-intake",
        "from": "replay-approval",
        "to": "intake",
        "type": "return"
      }
    ],
    "invariants": [
      "audit-record is reachable only from processing",
      "dead-letter is reachable only from validation",
      "replay-approval may return only to intake",
      "dead-letter never reaches processing directly"
    ],
    "labels": {
      "source": "事件源",
      "intake": "接入入口",
      "validation": "格式校验",
      "processing": "事件处理",
      "audit-record": "审计记录",
      "dead-letter": "死信队列",
      "replay-approval": "重放审批"
    }
  }
}

[ROLE COMPOSITION]
{
  "stability": "strict",
  "instructions": {
    "family": "multi-column-architecture",
    "structure": "seven frozen nodes arranged by responsibility with subordinate dead-letter and replay areas; small legible labels and a compact line legend where needed",
    "hierarchy": "direct primary paths and lighter return; approved invariants appear as nearby notes rather than a compulsory bottom rail",
    "human_elements": "none"
  },
  "must_preserve": [
    "preserve the article-specific frozen graph node-for-node edge-for-edge direction-for-direction and boundary-for-boundary",
    "preserve opaque white surface, readable sans-serif hierarchy, fine regions, and consistent technical icon treatment",
    "derive panel arrangement and spacing from confirmed content; numbering, central hub, and bottom rail are optional",
    "declare consistent per-image category or state colors; blue-green categories do not imply success or failure",
    "preserve exact native copy through frozen-ledger review"
  ],
  "may_vary": [
    "panel count, width, detail density, and reading order follow the current article",
    "line icons may have restrained local gradients shadows and shallow relief; keep the overall layout front-facing",
    "select layered mechanism, multi-column architecture, or staged overview as the content warrants"
  ]
}

[VISUAL DNA]
{
  "profile_id": "dense-technical-infographic",
  "style_pack_version": 3,
  "identity": {
    "name_en": "Technical Explainer Infographic",
    "name_zh": "技术原理图解",
    "promise": "readable article-specific engineering explanations with content-led layouts"
  },
  "surface": {
    "background": "fully opaque white or slightly cool-white canvas",
    "panels": "white or very lightly tinted blue-green regions with fine boundaries",
    "finish": "quiet front-facing technical layout with deliberate margins"
  },
  "palette_roles": {
    "mapping_policy": "per-diagram-consistent",
    "ink": "dark charcoal or navy for readable titles and body copy",
    "primary": "blue organizes confirmed structure or a named category",
    "secondary": "green organizes another category or a supported outcome; not automatically success",
    "attention": "orange for a supported emphasis or separate explanatory layer",
    "extension": "purple for a supported distinction when needed",
    "failure": "red only for an explicitly supported failure or warning",
    "neutral": "gray for past workflow secondary paths and supplementary text"
  },
  "line_language": {
    "primary": "direct readable arrows with visible arrowheads; scale stroke to export size",
    "secondary": "lighter supporting connectors and fine region borders; dashed lines have a declared meaning",
    "icons": "consistent line icons and simple pictograms, with restrained local shaded relief when it clarifies an object"
  },
  "material_and_texture": {
    "material": "white panels, light tints, technical icons",
    "icon_mode": "line-icons-with-restrained-local-relief",
    "shadow": "subtle panel separation and local object relief",
    "forbidden_depth": "no page-sized 3D scene, glass-device showcase, chrome, or isometric world"
  },
  "geometry": {
    "layout_policy": "content-led",
    "families": [
      "layered-mechanism",
      "multi-column-architecture",
      "staged-overview"
    ],
    "numbering": "optional-by-content",
    "nucleus": "the main subject or reading path; a central hub is not required",
    "summary": "optional-by-content"
  },
  "depth_and_camera": {
    "camera": "front-facing layout",
    "perspective": "local object relief allowed; no global perspective scene",
    "lighting": "neutral white, restrained object shading, no dramatic glow"
  },
  "typography": {
    "title": "dark readable title with optional blue-green keyword emphasis",
    "copy": "Chinese/English technical sans-serif, labels plus concise explanations",
    "workflow": "native generated copy is preserved only after exact validation"
  },
  "density_and_spacing": {
    "occupancy": "content-led-no-fixed-quota",
    "density": "enough verified content to explain the subject, with quiet gaps and subordinate detail",
    "reading_order": "title then main explanation then supporting details; chosen by content"
  },
  "required_traits": [
    "fully opaque white background and lightly tinted information regions",
    "readable title label and explanation hierarchy with blue-green organizing colors",
    "content-led layout with meaningful technical icons and quiet spacing",
    "native generated copy receives exact post-generation validation"
  ],
  "forbidden_traits": [
    "no transparent canvas or unreadable filler",
    "no page-sized 3D scene glass-device showcase chrome or isometric world",
    "no handwritten paper cyberpunk or decorative mascot",
    "no invented text numbers nodes arrows states metrics or topology"
  ],
  "neighbor_boundaries": [
    {
      "profile_id": "technical-editorial-minimal",
      "difference": "Style 9 explains technical relationships using labeled regions; Style 1 is sparse editorial illustration."
    },
    {
      "profile_id": "blueprint-linework",
      "difference": "Style 9 uses front-facing diagrams with restrained local icon relief; Style 4 uses polished spatial product scenes."
    },
    {
      "profile_id": "isometric-infrastructure",
      "difference": "Style 9 is front-facing and content-led; Style 5 uses a fixed-isometric world."
    },
    {
      "profile_id": "handwritten-systems-explainer",
      "difference": "Style 9 uses crisp vector-like geometry and sans-serif copy; Style 8 uses warm paper and lively handwritten annotation."
    }
  ]
}

[REFERENCE CONTRACT]
{
  "required_references": [
    {
      "id": "dense-technical-infographic-diagram-v2",
      "kind": "golden",
      "role": "diagram"
    }
  ],
  "bootstrap_reference": false,
  "semantic_authority": false,
  "target_golden_asset_id": "dense-technical-infographic-diagram-v2",
  "must_preserve": [
    "distinguishable main reading order and supporting detail through typography spacing and line weight",
    "white surface, light tints, blue-green category distinction and compact readable annotations"
  ],
  "may_vary": [
    "replace all example content with verified article-specific text and relationships",
    "choose panel number layout icons colors and optional summary by content; reference topology is not a template"
  ],
  "must_not_copy": [
    "labels",
    "numbers",
    "nodes",
    "topology",
    "specific_icon_arrangements",
    "example_story"
  ],
  "example_content_authoritative": false
}

[TEXT POLICY]
{
  "mode": "native-generated-copy-with-validation",
  "exact_text": [
    "事件接入：校验、死信、重放与审计",
    "事件源",
    "接入入口",
    "格式校验",
    "事件处理",
    "审计记录",
    "死信队列",
    "重放审批",
    "主流程",
    "异常路径",
    "重放路径",
    "审计记录仅来自事件处理",
    "死信队列仅来自格式校验",
    "重放审批只返回接入入口",
    "死信不直达事件处理"
  ],
  "copy_ledger_status": "frozen",
  "native_text_generation": true,
  "post_generation_validation": "exact",
  "deterministic_overlay": false,
  "fallback_policy": "correct-one-isolated-copy-defect-otherwise-regenerate",
  "inventory_mode": "closed",
  "rendering_rules": [
    "exact_text is the COMPLETE allowed visible-copy inventory, not a minimum list.",
    "Render every listed string exactly; add NO subtitles, explanations, legends, headings, translations or icon text absent from exact_text.",
    "All other prompt prose, IDs and reference text are instructions only: never print them.",
    "Keep explanatory notes outside the graph with NO arrows; an effect or benefit is not a process node.",
    "Where a frozen_graph exists, draw only its declared nodes and directed edges; do not infer connections from layout proximity."
  ]
}

[NEGATIVE CONSTRAINTS]
[
  "no transparent canvas or unreadable filler",
  "no page-sized 3D scene glass-device showcase chrome or isometric world",
  "no handwritten paper cyberpunk or decorative mascot",
  "no invented text numbers nodes arrows states metrics or topology",
  "do not invent facts copy numbers nodes relationships or causal links to fill space",
  "do not copy reference labels numbers specific icon arrangements topology or example story",
  "no transparent background page-sized 3D glass showcase isometric world or decorative character",
  "do not invent omit reverse merge duplicate or reroute a frozen relationship; do not connect parallel benefits as sequential steps",
  "Do not add brokers, databases, consumers, notification nodes, vendors, protocols, batch sizes, timing, or automatic replay guarantees.",
  "Do not omit, duplicate, reverse, merge, or invent any frozen node or edge.",
  "Do not add a successful-only condition to audit records. No subtitle or node descriptions. Only exact_text is visible; no extra 路径说明 or 关键约束 headings."
]

[ACCEPTANCE CHECK]
[
  "all visible native copy equals the frozen ledger",
  "main explanation and supporting detail remain readable at article width",
  "color meaning is consistent within this image and no category is misrepresented as a status",
  "the composition uses Style 9 technical layout rather than another profile's scene or handwriting",
  "every visible node label edge direction group and invariant equals the frozen graph; main and supporting paths remain distinguishable",
  "fully opaque white background and lightly tinted information regions",
  "readable title label and explanation hierarchy with blue-green organizing colors",
  "content-led layout with meaningful technical icons and quiet spacing",
  "native generated copy receives exact post-generation validation"
]
