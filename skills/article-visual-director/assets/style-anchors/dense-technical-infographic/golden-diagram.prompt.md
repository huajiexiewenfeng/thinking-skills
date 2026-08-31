[OUTPUT CONTRACT]
{
  "platform": "cross-platform-article-body",
  "aspect_ratio": "16:9",
  "occupancy": "eighty-five to ninety-two percent intentional foreground occupancy",
  "crop_rules": "preserve all eight nodes, all eight arrowheads, the complete return path, legend, title, and four invariant cells; keep critical copy outside the outer five percent",
  "output_count": 1,
  "execution_policy": {
    "mode": "built-in-image-gen",
    "model_selection": "host-managed",
    "runtime_identity": "record-if-returned",
    "api_key_required": false,
    "fallback_approval": "not-required"
  }
}

[ARTICLE SEMANTICS]
{
  "confirmed": [
    "The primary path is task submission, validation, queueing, scheduling, execution, and result archival in that order.",
    "Execution may enter a retry decision through one exception edge.",
    "The retry decision may either return to the queue or continue to failure archival."
  ],
  "simplifications": [
    "Use exactly eight generic lifecycle nodes with one explicit primary row and one compact exception branch.",
    "Use color and line treatment only to distinguish primary, exception, and return edges; do not invent runtime behavior."
  ],
  "blocked": [
    "Do not add retry counts, timing, workers, executors, databases, notifications, vendors, protocols, metrics, guarantees, people, robots, AI brains, or any additional node.",
    "Do not omit, merge, duplicate, rename, reorder, or split a frozen node.",
    "Do not add, omit, reverse, merge, fork, or redirect a frozen edge; every arrowhead must terminate at its declared destination.",
    "Do not copy the approved concept's upper/lower backpressure comparison, benefit stack, example icons, or semantic story.",
    "Do not add explanatory prose, captions, slogans, footer text, legends, section labels, or annotations outside the frozen copy ledger."
  ],
  "frozen_graph": {
    "nodes": [
      "task-submission",
      "validation",
      "queue",
      "scheduling",
      "execution",
      "result-archive",
      "retry-decision",
      "failure-archive"
    ],
    "edges": [
      {
        "id": "edge-submit-validate",
        "from": "task-submission",
        "to": "validation",
        "type": "primary"
      },
      {
        "id": "edge-validate-queue",
        "from": "validation",
        "to": "queue",
        "type": "primary"
      },
      {
        "id": "edge-queue-schedule",
        "from": "queue",
        "to": "scheduling",
        "type": "primary"
      },
      {
        "id": "edge-schedule-execute",
        "from": "scheduling",
        "to": "execution",
        "type": "primary"
      },
      {
        "id": "edge-execute-result",
        "from": "execution",
        "to": "result-archive",
        "type": "primary"
      },
      {
        "id": "edge-execute-retry",
        "from": "execution",
        "to": "retry-decision",
        "type": "exception"
      },
      {
        "id": "edge-retry-queue",
        "from": "retry-decision",
        "to": "queue",
        "type": "return"
      },
      {
        "id": "edge-retry-failure",
        "from": "retry-decision",
        "to": "failure-archive",
        "type": "exception"
      }
    ],
    "invariants": [
      "result-archive is reachable only from execution",
      "failure-archive is reachable only from retry-decision",
      "retry-decision may return only to queue",
      "no failure state reaches result-archive directly"
    ]
  }
}

[ROLE COMPOSITION]
{
  "stability": "strict",
  "instructions": {
    "family": "architecture-flow",
    "canvas": "fully opaque 16:9 pure white or slightly cool-white technical poster",
    "hierarchy": "one oversized deep navy Chinese title; one dominant six-node left-to-right primary lifecycle row; one smaller two-node exception branch below execution; one compact legend; one full-width bottom invariant rail",
    "numbered_sections": [
      "01 提交与校验 groups only 任务提交 and 任务校验",
      "02 排队与调度 groups only 任务队列 and 任务调度",
      "03 执行与归档 groups only 任务执行 and 结果归档",
      "04 重试与失败 groups only 重试判断 and 失败归档"
    ],
    "primary_path": "exactly five solid royal-blue directed edges connect the six primary nodes left to right: 任务提交 to 任务校验 to 任务队列 to 任务调度 to 任务执行 to 结果归档",
    "exception_path": "one solid orange directed edge descends from 任务执行 to 重试判断; one solid red directed edge continues from 重试判断 to 失败归档",
    "return_path": "one dashed royal-blue directed edge returns from 重试判断 to 任务队列 with its arrowhead visibly terminating at 任务队列",
    "state_colors": "结果归档 is the only engineering-green terminal; 失败归档 is the only red terminal; all non-terminal nodes use white with royal-blue structure, except the orange retry-decision emphasis",
    "legend": "show only the three frozen legend labels 主流程, 异常路径, 返回路径 with matching line samples",
    "bottom_rail": "show exactly four frozen invariant statements in four balanced cells",
    "density": "dense body infographic with eighty-five to ninety-two percent intentional occupancy and ample separation for exact arrow tracing",
    "reading_order": "title, numbered primary groups, exception branch, legend, invariant rail",
    "human_elements": "none"
  },
  "must_preserve": [
    "preserve the article-specific frozen graph exactly node-for-node edge-for-edge direction-for-direction and boundary-for-boundary",
    "preserve an architecture-flow or layered-comparison with strict front-facing flat geometry numbered regions legend and bottom invariant rail",
    "preserve crisp direct arrow grammar royal blue primary paths and confirmed semantic exception success and failure colors",
    "preserve native generated copy only after exact label validation and frozen-graph equality"
  ],
  "may_vary": [
    "only article-supported node labels groups edge types and topology may replace the golden example",
    "group dimensions and module placement may adapt to the frozen graph while keeping high organized density",
    "technical flat vector-like icons may vary when they clarify confirmed node roles"
  ]
}

[VISUAL DNA]
{
  "profile_id": "dense-technical-infographic",
  "style_pack_version": 3,
  "identity": {
    "name_en": "Dense Technical Infographic",
    "name_zh": "高密度技术信息图",
    "promise": "turn verified technical content into a high-density text-bearing engineering teaching poster"
  },
  "surface": {
    "background": "fully opaque pure white or slightly cool-white canvas",
    "panels": "pale blue or white rounded information regions",
    "finish": "clean flat technical poster without grid paper or environmental scene"
  },
  "palette_roles": {
    "ink": "deep navy carries the oversized title",
    "primary": "royal blue carries normal structure and the main path",
    "success": "engineering green carries supported success and benefit",
    "attention": "orange carries conclusions and explicit attention",
    "extension": "purple carries supported configuration or modularity",
    "failure": "red carries supported failure or danger",
    "neutral": "cool gray carries secondary copy"
  },
  "line_language": {
    "primary": "crisp two-pixel direct arrows",
    "secondary": "one-pixel separators and dashed group boundaries",
    "icons": "flat vector-like technical icons with consistent stroke and fill"
  },
  "material_and_texture": {
    "material": "flat vector-like cards and icons",
    "shadow": "minimal soft separation only",
    "forbidden_depth": "no glass acrylic chrome 3D isometric or environmental depth"
  },
  "geometry": {
    "families": [
      "mechanism-poster",
      "architecture-flow",
      "layered-comparison"
    ],
    "zones": "three to six numbered explanatory zones",
    "nucleus": "one central mechanism or architecture",
    "summary": "one full-width bottom takeaway rail"
  },
  "depth_and_camera": {
    "camera": "strict front-facing flat composition",
    "perspective": "none",
    "lighting": "neutral white with no dramatic glow"
  },
  "typography": {
    "title": "oversized deep navy title",
    "copy": "clean technical sans-serif Chinese and English",
    "workflow": "native generated copy is preserved only after exact validation"
  },
  "density_and_spacing": {
    "occupancy": "eighty-five to ninety-two percent",
    "density": "high but organized",
    "reading_order": "title then central mechanism then numbered zones then bottom takeaway rail"
  },
  "required_traits": [
    "fully opaque pure white technical poster",
    "oversized deep navy title and clear central mechanism",
    "flat vector-like icons and rounded numbered zones",
    "high organized density with a bottom takeaway rail",
    "native generated copy receives exact post-generation validation"
  ],
  "forbidden_traits": [
    "no people mascots narrators or hands",
    "no glass acrylic chrome 3D or isometric depth",
    "no handwritten paper watercolor sketch or comic treatment",
    "no cyberpunk HUD code rain hologram or decorative AI brain",
    "no unsupported text numbers nodes arrows states metrics or topology"
  ],
  "neighbor_boundaries": [
    {
      "profile_id": "technical-editorial-minimal",
      "difference": "Style 9 is a dense numbered teaching poster; Style 1 is sparse technical editorial illustration."
    },
    {
      "profile_id": "blueprint-linework",
      "difference": "Style 9 is flat and text-forward; Style 4 uses polished product depth for covers and concepts."
    },
    {
      "profile_id": "isometric-infrastructure",
      "difference": "Style 9 is front-facing and flat; Style 5 is a fixed-isometric matte world."
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
      "id": "dense-technical-infographic-concept-v1",
      "kind": "bootstrap_candidate",
      "profile_id": "dense-technical-infographic",
      "role": "concept",
      "approval": "approved",
      "bootstrap_reference": true,
      "semantic_authority": false
    }
  ],
  "bootstrap_reference": true,
  "semantic_authority": false,
  "target_golden_asset_id": "dense-technical-infographic-diagram-v1",
  "must_preserve": [
    "preserve strict front-facing flat diagram geometry crisp arrows rounded regions legend and bottom invariant rail",
    "preserve controlled blue green orange purple and red semantic roles only where the frozen graph supports them"
  ],
  "may_vary": [
    "replace the complete graph with the validated article-specific frozen graph",
    "vary node count group size and path placement only as the frozen graph requires"
  ],
  "must_not_copy": [
    "labels",
    "numbers",
    "nodes",
    "topology",
    "icons",
    "example_story"
  ],
  "example_content_authoritative": false
}

[TEXT POLICY]
{
  "mode": "native-generated-copy-with-validation",
  "exact_text": [
    "异步任务生命周期：从提交到归档",
    "01 提交与校验",
    "02 排队与调度",
    "03 执行与归档",
    "04 重试与失败",
    "任务提交",
    "任务校验",
    "任务队列",
    "任务调度",
    "任务执行",
    "结果归档",
    "重试判断",
    "失败归档",
    "主流程",
    "异常路径",
    "返回路径",
    "结果归档仅来自任务执行",
    "失败归档仅来自重试判断",
    "重试判断只返回任务队列",
    "失败状态不直达结果归档"
  ],
  "copy_ledger_status": "frozen",
  "native_text_generation": true,
  "post_generation_validation": "exact",
  "deterministic_overlay": false,
  "fallback_policy": "correct-one-isolated-copy-defect-otherwise-regenerate"
}

[NEGATIVE CONSTRAINTS]
[
  "no people mascots narrators or hands",
  "no glass acrylic chrome 3D or isometric depth",
  "no handwritten paper watercolor sketch or comic treatment",
  "no cyberpunk HUD code rain hologram or decorative AI brain",
  "no unsupported text numbers nodes arrows states metrics or topology",
  "no people faces hands characters instructors narrators mascots or decorative AI brains",
  "do not invent omit reverse merge duplicate or reroute any frozen semantic relationship",
  "do not use glass acrylic chrome 3D isometric handwritten cyberpunk or meaningless dashboard styling",
  "do not copy golden labels numbers nodes topology icons or example story",
  "Do not add retry counts, timing, workers, executors, databases, notifications, vendors, protocols, metrics, guarantees, people, robots, AI brains, or any additional node.",
  "Do not omit, merge, duplicate, rename, reorder, or split a frozen node.",
  "Do not add, omit, reverse, merge, fork, or redirect a frozen edge; every arrowhead must terminate at its declared destination.",
  "Do not copy the approved concept's upper/lower backpressure comparison, benefit stack, example icons, or semantic story.",
  "Do not add explanatory prose, captions, slogans, footer text, legends, section labels, or annotations outside the frozen copy ledger."
]

[ACCEPTANCE CHECK]
[
  "every visible node label edge arrowhead direction group boundary number state and invariant equals the frozen graph and copy ledger",
  "no unsupported shortcut metric protocol vendor or causal claim appears",
  "the diagram is fully opaque legible at article width and remains human-free",
  "the result reads as the strict architecture diagram role of Style 9 rather than Style 4 or Style 8",
  "fully opaque pure white technical poster",
  "oversized deep navy title and clear central mechanism",
  "flat vector-like icons and rounded numbered zones",
  "high organized density with a bottom takeaway rail",
  "native generated copy receives exact post-generation validation"
]
