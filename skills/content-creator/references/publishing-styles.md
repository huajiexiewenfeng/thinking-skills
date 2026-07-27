# Publishing Styles

Read this reference when preparing Chinese technical WeChat layouts or technical article covers. A direct user style request always overrides these defaults.

## Technical Minimal Green

Use this as the default style for Chinese technical WeChat articles unless the user requests another style. Also use it when the user asks for a WeChat article similar to "技术极简", "绿色标题", or "一小段一小段但不要一句一行", or provides screenshots with green heading bars, left green rule headings, gray inline code pills, and compact technical prose.

If additional named WeChat styles are available and the requested style is not obvious, ask which style to use before drafting. Offer Technical Minimal Green as the recommended default for technical articles.

- Use green section headings for major sections: inline `h2` with white text on `#009b72`, compact padding, and moderate top margin.
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
