# Article Visual Director Cases

Use these cases to test whether `article-visual-director` behaves like an article-level visual editor rather than a generic image prompt generator.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| “这篇 CSDN Markdown 已定稿，请规划封面和重要小节配图。” | Read the article, select semantic visual beats, recommend one visual direction plus alternatives, and stop at the plan approval gate. |
| “给这篇公众号技术文章做封面和正文配图，手机上要清楚。” | Use a 2.35:1 square-safe headline cover, mobile-readable body assets, and a style fingerprint shared across the set. |
| “同一篇文章要发公众号和 CSDN。” | Generate separate platform cover specifications while reusing only body assets that pass both layout profiles. |
| “这篇文章包含请求时序和三层系统边界。” | Use deterministic diagrams for exact labels and relationships; block facts that the article does not confirm. |
| “文章已经有两张截图，只补几个真正需要的图。” | Preserve existing images and select only sections where a new visual improves comprehension or pacing. |

## Negative Cases

| User Request | Should Not Do | Better Route |
|---|---|---|
| “我只有一个文章想法，还没确定读者和观点。” | Do not lock a visual theme or generate a visual manifest. | `content-creator` |
| “把这张产品图的背景换成蓝色。” | Do not create an article-wide visual plan. | `imagegen` |
| “把确认过的系统设计做成一个离线 HTML 可视化页面。” | Do not turn it into Markdown section images. | `technical-visual-companion` |

## Mixed Cases

| User Request | Expected Behavior |
|---|---|
| “文章已定稿，需要三张概念插画和一张准确的 Runtime 架构图。” | Own the article-level plan; route concepts to `imagegen` and the architecture to a deterministic diagram under one style profile. |
| “文章刚写完，沿用已经确认的读者、论点和语气继续做配图。” | Accept the `content-creator` brief without restarting content discovery, then begin visual planning. |
| “已经选好 Style 8，但编译后的提示词没有 REFERENCE CONTRACT。” | Stop before image generation with `PROMPT_BLOCK_MISSING`; repair and recompile Prompt IR instead of falling back to a free-form prompt. |

## Quality Checks

- Select semantic visual beats rather than one image per heading.
- Recommend one primary direction and two meaningfully different alternatives.
- Provide the complete plan before any generation or Markdown mutation.
- Route exact relationships and labels to deterministic diagrams.
- Require style-anchor approval when the plan has at least three raster assets.
- Preserve the source article and version output paths by default.
- Save final Prompts, alt text, editable sources, approval states, and validation states.
- Treat unconfirmed technical details as blocked facts, not creative freedom.

## Failure Checks

- Generates before approval.
- Presents inferred architecture as confirmed fact.
- Uses raster image generation for dense exact technical labels.
- Repeats the same decorative composition after every heading.
- Claims safe insertion without source hashing, anchor validation, stable markers, or file checks.
- Overwrites the source Markdown without explicit authorization.
- Generates from a Style Pack v3 prompt that is missing `REFERENCE CONTRACT` or any other required Prompt IR block.
