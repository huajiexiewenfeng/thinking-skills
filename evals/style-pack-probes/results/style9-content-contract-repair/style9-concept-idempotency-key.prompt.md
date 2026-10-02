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
    "A first request presents an idempotency key before a side-effecting operation is executed.",
    "The operation result is recorded against the key for a bounded retention context.",
    "A repeated request that matches the recorded key may return the existing result rather than repeat the operation."
  ],
  "simplifications": [
    "Use an upper first-request path and a lower repeated-request path that meet at one key record.",
    "Show reuse of the existing result without specifying storage technology, expiry duration, or payment behavior."
  ],
  "blocked": [
    "Do not claim that an idempotency key makes all business logic correct or prevents every duplicate effect.",
    "Do not add payment vendors, databases, time-to-live numbers, globally unique guarantees, locks, queues, or extra decision stages.",
    "Do not turn 减少重复执行风险 or 不代表业务自动正确 into a node or connect either note with arrows. No extra copy beyond exact_text."
  ],
  "frozen_graph": {
    "nodes": [
      "first",
      "execute",
      "record",
      "repeat",
      "lookup",
      "return"
    ],
    "labels": {
      "first": "首次请求",
      "execute": "执行操作",
      "record": "记录结果",
      "repeat": "重复请求",
      "lookup": "命中记录",
      "return": "返回既有结果"
    },
    "edges": [
      {
        "id": "first-execute",
        "from": "first",
        "to": "execute",
        "type": "primary"
      },
      {
        "id": "execute-record",
        "from": "execute",
        "to": "record",
        "type": "primary"
      },
      {
        "id": "repeat-lookup",
        "from": "repeat",
        "to": "lookup",
        "type": "primary"
      },
      {
        "id": "record-lookup",
        "from": "record",
        "to": "lookup",
        "type": "primary",
        "meaning": "existing saved result supplies lookup"
      },
      {
        "id": "lookup-return",
        "from": "lookup",
        "to": "return",
        "type": "primary"
      }
    ],
    "invariants": [
      "Repeated requests never point to execute or record.",
      "The effect and limitation are unconnected notes, never nodes."
    ]
  }
}

[ROLE COMPOSITION]
{
  "stability": "family",
  "instructions": {
    "family": "layered-mechanism",
    "structure": "Upper blue lane first -> execute -> record. Lower green lane repeat -> lookup -> return. One separate connector record -> lookup supplies the existing record; never draw lookup -> record. Put 幂等键 below each request icon. Put the two effect/limitation statements in a separate note region with no arrows.",
    "hierarchy": "first request and reuse distinguishable by labels and blue-green grouping, main relation ahead of supporting explanation",
    "human_elements": "none"
  },
  "must_preserve": [
    "explain one coherent question using a mechanism comparison or related independent considerations; unconnected considerations stay unconnected",
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
      "id": "dense-technical-infographic-concept-v2",
      "kind": "golden",
      "role": "concept"
    }
  ],
  "bootstrap_reference": false,
  "semantic_authority": false,
  "target_golden_asset_id": "dense-technical-infographic-concept-v2",
  "must_preserve": [
    "clear region hierarchy and icon-label-explanation rhythm with crisp technical linework",
    "fine borders, related color families, readable spacing; emphasized detail remains subordinate to the overall explanation"
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
    "幂等键：识别重复请求，减少重复副作用",
    "首次请求",
    "幂等键",
    "执行操作",
    "记录结果",
    "重复请求",
    "命中记录",
    "返回既有结果",
    "减少重复执行风险",
    "不代表业务自动正确"
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
  "Do not claim that an idempotency key makes all business logic correct or prevents every duplicate effect.",
  "Do not add payment vendors, databases, time-to-live numbers, globally unique guarantees, locks, queues, or extra decision stages.",
  "Do not turn 减少重复执行风险 or 不代表业务自动正确 into a node or connect either note with arrows. No extra copy beyond exact_text."
]

[ACCEPTANCE CHECK]
[
  "all visible native copy equals the frozen ledger",
  "main explanation and supporting detail remain readable at article width",
  "color meaning is consistent within this image and no category is misrepresented as a status",
  "the composition uses Style 9 technical layout rather than another profile's scene or handwriting",
  "fully opaque white background and lightly tinted information regions",
  "readable title label and explanation hierarchy with blue-green organizing colors",
  "content-led layout with meaningful technical icons and quiet spacing",
  "native generated copy receives exact post-generation validation"
]
