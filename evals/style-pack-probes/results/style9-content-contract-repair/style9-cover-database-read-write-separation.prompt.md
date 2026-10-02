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
    "A primary role accepts writes while read-only replicas may serve read traffic.",
    "Changes flow from the primary role toward read-only replicas through a generic synchronization relationship.",
    "A failover decision requires observing role health and selecting a valid replacement role."
  ],
  "simplifications": [
    "Show one write entrance, one primary role, two representative read-only replicas, one read entrance, and one compact failover decision zone.",
    "Treat synchronization and failover as generic responsibilities rather than a vendor-specific algorithm."
  ],
  "blocked": [
    "Do not claim zero data loss, instant failover, perfect consistency, unlimited reads, or automatic correctness.",
    "Do not add vendor names, protocols, latency numbers, throughput numbers, regions, consensus nodes, or extra storage roles.",
    "Do not connect the failover note to any node. Do not draw replica-to-query arrows. No extra copy beyond exact_text."
  ],
  "frozen_graph": {
    "nodes": [
      "write",
      "primary",
      "replica-a",
      "replica-b",
      "query"
    ],
    "labels": {
      "write": "01 写入入口",
      "primary": "02 主节点",
      "replica-a": "03 只读副本",
      "replica-b": "03 只读副本",
      "query": "查询入口"
    },
    "edges": [
      {
        "id": "write-primary",
        "from": "write",
        "to": "primary",
        "type": "primary",
        "meaning": "write request"
      },
      {
        "id": "primary-a",
        "from": "primary",
        "to": "replica-a",
        "type": "primary",
        "meaning": "变更同步"
      },
      {
        "id": "primary-b",
        "from": "primary",
        "to": "replica-b",
        "type": "primary",
        "meaning": "变更同步"
      },
      {
        "id": "query-a",
        "from": "query",
        "to": "replica-a",
        "type": "primary",
        "meaning": "read request"
      },
      {
        "id": "query-b",
        "from": "query",
        "to": "replica-b",
        "type": "primary",
        "meaning": "read request"
      }
    ],
    "invariants": [
      "No response arrows are shown. Query arrows point FROM query TO replicas.",
      "Failover is an unconnected explanatory note, not a topology transition."
    ]
  }
}

[ROLE COMPOSITION]
{
  "stability": "family",
  "instructions": {
    "family": "staged-overview",
    "structure": "Five-node front-facing overview: blue write entrance points to primary, primary synchronizes to two replicas; green query entrance points toward both replicas. Below it, an orange failover note with NO arrows. Only exact_text may appear; omit automatic panel captions.",
    "hierarchy": "blue write category and green read category; green denotes read responsibility, not a success guarantee; bounded failover caution in orange",
    "human_elements": "none"
  },
  "must_preserve": [
    "preserve a readable overview and title-body balance; the CI/CD reference teaches hierarchy not a required five-step workflow",
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
      "id": "dense-technical-infographic-cover-v2",
      "kind": "golden",
      "role": "cover"
    }
  ],
  "bootstrap_reference": false,
  "semantic_authority": false,
  "target_golden_asset_id": "dense-technical-infographic-cover-v2",
  "must_preserve": [
    "readable title-body balance, consistent panel spacing, and restrained local icon relief",
    "white surface, quiet gaps, dark text, blue-green organizing accents"
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
    "读写分离：把查询压力与写入责任分开",
    "01 写入入口",
    "02 主节点",
    "03 只读副本",
    "04 故障切换",
    "变更同步",
    "查询入口",
    "写入只由主节点负责",
    "只读副本承担读请求",
    "故障切换需要确认状态"
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
  "Do not claim zero data loss, instant failover, perfect consistency, unlimited reads, or automatic correctness.",
  "Do not add vendor names, protocols, latency numbers, throughput numbers, regions, consensus nodes, or extra storage roles.",
  "Do not connect the failover note to any node. Do not draw replica-to-query arrows. No extra copy beyond exact_text."
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
