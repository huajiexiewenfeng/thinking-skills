# Publishing Styles

Read this reference when preparing Chinese technical WeChat layouts or technical article covers. A direct user style request always overrides these defaults.

## green2 (Default WeChat Layout)

**Style ID: `green2`.** Use this for WeChat Official Account articles by default, including an unspecified WeChat layout or a generic `green` request. Follow another named style only when the user explicitly selects it. This is a publishing layout, not an illustration profile.

### Appearance and Markdown boundaries

- White background, dark gray body `#26332E`, muted green `#237A55`, and pale green `#F2F8F4`; keep the page clean with comfortable whitespace.
- Body prose, `**bold**`, lists, `>` quotations, links, and images stay in ordinary Markdown. Do not add `<p>` to each paragraph, wrap the article in HTML, convert Markdown lists/quotes into HTML, or use `<br/>` for spacing.
- Only level-two headings and a few necessary emphasis callouts may use inline HTML. Do not add callouts merely for decoration.
- Keep the article title as Markdown `#` and level-three headings as Markdown `###`; do not make every heading level a colored block.

### Exact level-two heading template

Preserve the original heading text and numbering:

```html
<h2 style="margin:26px 0 16px;padding:8px 12px;border-left:4px solid #237A55;background:#F2F8F4;color:#237A55;font-size:22px;line-height:1.45;">01 章节标题</h2>
```

Use this left-rule, pale-green template, not the legacy centered underline or a solid-green title bar.

### Reading rhythm, lists, and facts

- Keep mobile paragraphs short, with one main idea and a blank line between them. Preserve complete sentences; do not fragment clauses just to create whitespace.
- Use a little Markdown bold for key phrases. Narrow long full-paragraph emphasis rather than turning the screen green or bolding every conclusion.
- Use bullets for genuinely parallel information and numbered lists for steps. Avoid deep nesting, wide tables, added emoji, decorative rules, and repeated cards.
- Keep quotations as `>` Markdown.
- Layout-only work does not authorize changing viewpoints, technical conclusions, facts, or adding unverified cases or numbers. Report source uncertainties separately.

### Confirmed images

- Preserve approved covers and body images, their visual style, content, proportions, and files. Never recolor them green, stretch, regenerate, or replace them because green2 is selected.
- Use relative Markdown image paths and meaningful alt text. Put a short, accurate caption on its own line below the image; identify test data, redrawn/redacted material, and conceptual examples honestly.
- New placements default to heading -> image -> caption -> prose. Preserve an already explicit or approved image position.
- Keep the source article and existing user edits; create a separate formatted copy. A request to update this Skill does not start image production.

### Deliverables and reading preview

- The primary deliverable remains Markdown. Preserve the approved naming convention: `{source-stem}-green-illustrated.md` with images, or `{source-stem}-green.md` without images; the profile name is green2. If revising an existing formatted copy, keep its accepted name and preserve the source.
- When a renderer is available, green2 permits a sibling `*-preview.html` reading preview. If unavailable, deliver the Markdown and state that the preview was not rendered; do not claim unrun checks passed.
- Preview defaults: white background, body `#26332E`, `16px` font, line height `1.9`, maximum width `760px`, and `18px` left/right padding. The preview may apply page-level CSS without changing Markdown markup.
- Check `390px` and `430px` widths for horizontal overflow, broken or distorted images, and cramped/cut-off headings. Confirm image positions and that layout-only edits preserved the visible wording and approved image files.
- Preview HTML is for reading checks. Never paste the full HTML page, CSS, or paragraph tags back into the Markdown deliverable.

## Technical Minimal Green (Legacy, Explicit Only)

Use this legacy style only when the user explicitly selects **Technical Minimal Green** or its legacy centered-underlined design. Its full paragraph styling below applies only to that explicit mode. An unspecified WeChat layout, a generic green request, and green2 all use **green2** instead.

Do not ask the user to choose a style again when green2 or the default WeChat layout already applies.

- Use lightweight green-underlined section headings for major sections. The default `h2` is centered, with green text on white, regular-to-medium weight, and a short bottom rule that follows the title width. Use this exact mobile-safe baseline: `<h2 style="display:table;max-width:100%;box-sizing:border-box;color:#009b72;font-size:21px;line-height:1.5;font-weight:400;letter-spacing:0.02em;text-align:center;padding:0 0 7px;margin:30px auto 16px;border-bottom:2px solid #009b72;word-break:break-word;">...</h2>`.
- Keep the heading only modestly larger than the `18px` body text: `21px` by default (about `1.17x` the body size). This lighter scale and `font-weight:400` match phone-first screenshots where the heading should orient the reader without dominating the screen.
- Treat the former white-on-solid-green `h2` bar as an optional high-emphasis variant, not the Technical Minimal Green default. Use it only when the user explicitly requests filled green bars, label-like headings, or stronger visual segmentation.
- Use left green rule headings for secondary sections: `border-left:5px solid #009b72`, gray or black title text, and compact spacing.
- Use body paragraphs of 2-3 connected sentences. Do not make every sentence its own paragraph.
- For the "段落分明但不要一句一行" style, use connected 2-3 sentence paragraphs, with occasional one-sentence emphasis only. Do not mistake mobile readability for breaking every clause into a separate paragraph.
- Keep mobile spacing compact but readable: body `font-size:18px`, `line-height:1.7-1.8`, paragraph margin around `14-18px 0`; emphasis paragraphs around `20-24px 0`.
- Use green bold emphasis for thesis or takeaway sentences, not for every paragraph.
- Style the whole article, not only headings. Wrap ordinary body paragraphs in `<p style="font-size:18px;line-height:1.75;margin:16px 0;color:#333;">...</p>` and thesis or transition emphasis in `<p style="font-size:18px;line-height:1.75;margin:20px 0;color:#009b72;font-weight:700;">...</p>`.
- Use `<blockquote style="border-left:4px solid #009b72;margin:18px 0;padding:8px 12px;background:#f7fbf9;color:#333;font-size:18px;line-height:1.75;">...</blockquote>` for grouped examples, comparisons, and compact conclusion lists.
- Avoid `div`-based left-rule callout blocks. Some publishing editors strip or ignore `div style`; `blockquote` is more stable when copying rendered content into publishing backends.
- When creating a publishable HTML copy page, generate a sibling `*-publish.html` file that renders the article body and includes a copy button. Mention that manually selecting the rendered article body may preserve styles better than clipboard-button copying.
- Render technical terms as inline gray pills with red text when HTML styling helps, for example `<span style="background:#f2f2f2;color:#c7254e;padding:2px 6px;border-radius:4px;">state_5.sqlite</span>`.
- Avoid oversized line height such as `2` and large repeated paragraph margins such as `24px 0`; they create a sparse, disconnected page.
- Avoid turning lists of related diagnostic questions into one-line paragraphs. Merge them into cohesive small paragraphs or compact bullets.
- Avoid overusing rhetorical parallelism. If several consecutive paragraphs share the same sentence pattern, rewrite them into varied prose before finalizing.

## Knowledge Graph Neon Doctor

Use this as the preferred cover direction for articles about Obsidian LLM Wiki, knowledge graphs, RAG, AI Agents, agent runtimes, open-source AI systems, knowledge health, diagnostics, or similar technical infrastructure unless the user requests another visual style.

- Use a deep navy-to-black gradient digital background with cyan-green neon light, restrained blue-violet accents, subtle grid lines, fine data particles, and flowing data trails. Keep it futuristic and premium without becoming noisy cyberpunk.
- Build a clear left-to-right narrative when it fits the topic: scattered source documents or system inputs on the left, an organized graph or workflow in the center, and a glassmorphism dashboard, runtime, evaluator, or diagnostic layer on the right.
- For knowledge-system and Doctor topics, prefer glowing relationship lines, layered graph nodes, a circular health score, and a read-only software diagnostic interface. The Doctor should be an interface metaphor, not a human doctor or humanoid robot.
- Use cool green as the primary accent because it connects knowledge organization, system health, and the Technical Minimal Green article identity. Add cyan and restrained blue-violet light for depth.
- Choose the canvas ratio by publishing slot: use `2.35:1` (commonly `900x383`) for a WeChat Official Account headline cover, `1:1` for a WeChat secondary article thumbnail, and `16:9` for CSDN, Zhihu, or a general technical-blog cover. Do not reuse a generic `16:9` prompt for a WeChat headline cover.
- Keep the main Chinese title large and sharp in the upper or central safe area. Use one short subtitle and no more than three compact English labels. For WeChat headline covers, keep the title, face, and core subject inside a central square-safe region so they survive a possible `1:1` thumbnail crop.
- Avoid official logos, brand marks, watermarks, people, humanoid robots, dense code, excessive UI labels, distorted Chinese text, cropped titles, and large meaningless dark areas.
- Do not force a knowledge graph or Doctor dashboard onto unrelated topics. Preserve the lighting, palette, depth, and clean high-tech composition while replacing the central metaphor with one that matches the article's thesis.
