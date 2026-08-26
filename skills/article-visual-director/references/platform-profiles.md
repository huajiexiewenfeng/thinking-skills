# Platform Profiles

These are production defaults, not guarantees of current platform UI behavior. If exact publishing constraints matter, verify the current editor or official platform documentation before final export.

## CSDN

### Cover

- Default aspect ratio: `16:9`.
- Working export: `1200 x 675` PNG or high-quality JPEG.
- Keep the focal subject and any deterministic title inside the central 80% width and 75% height.
- Use high contrast at thumbnail size; avoid thin detail near the edges.
- Prefer a short title. Render exact Chinese text deterministically rather than asking an image model to spell it.

### Body visuals

- Default concept illustration: `16:9` or `3:2`.
- Default process/architecture diagram: `16:9` or `4:3`, chosen from label density.
- Export diagrams as PNG when renderer or editor SVG support is uncertain.
- Design for a typical article column: use large labels, thick enough arrows, and no code-sized annotations.
- Put useful alt text in Markdown even if the publishing UI later transforms it.

## WeChat Official Accounts

### Headline cover

- Default headline aspect ratio: approximately `2.35:1`.
- Working export: `900 x 383`.
- The final published cover includes the approved article title by default. A text-free cover requires an explicit user opt-out recorded in the manifest.
- Generate the image background without text, then add exact title typography through a deterministic SVG/HTML layer. Do not treat an image model's approximate Chinese text as the final title layer.
- Keep the essential subject and deterministic title within a central square-safe region so alternate crops remain meaningful.
- Square-safe does not mean square-confined: preserve the semantic nucleus in the square while composing the full-width cover for the wide canvas.
- For balanced or three-part horizontal narratives, let the intentional foreground hierarchy occupy roughly 70–90% of the canvas width. Supporting structures may extend beyond the square and crop partially in alternate thumbnails.
- Extend background color to both sides, but do not leave both outer bands as background-only atmosphere when they are needed to express the wide composition.
- Test the full wide crop and a central square crop before approval.

Wide-cover occupancy acceptance:

- The full `2.35:1` crop must read as the primary composition, not as a square poster placed on a wide blank canvas.
- The central square crop must retain the primary title and semantic nucleus; it does not need to retain every supporting object.
- Fail a balanced or three-part cover if the complete title and foreground system are confined to the central square and both outer side bands are uniform or near-uniform background.
- When the concept explicitly contains left and right forces, both outer bands should contain recognizable, non-essential continuation of those forces. Decorative particles, gradients, or unrelated filler do not satisfy this check.

### Body visuals

- Prefer a width of at least `1080 px` for raster body images when source quality permits.
- Use `16:9`, `3:2`, or `4:3` according to information density; consistency matters more than forcing one ratio.
- Keep important labels and arrows away from the outer 8% on all sides.
- Prefer PNG for diagrams and JPEG/PNG for illustration according to texture and file size.
- Avoid small captions baked into images; place explanatory text in Markdown whenever possible.

## X Articles

These are working production defaults rather than official fixed dimensions; verify the current X editor when exact crop behavior matters.

### Cover

- Default working aspect ratio: `16:9`.
- Working export: `1600 x 900` PNG or high-quality JPEG.
- A title inside the image is optional because the article UI also presents the article title. Add deterministic cover text when the image must communicate the thesis while detached from the article card.
- When using cover text, generate a text-free background first, then add the exact title and up to four short supporting points through an editable SVG/HTML layer.
- Keep the title, supporting points, and semantic nucleus inside the central 80% width and 75% height. Verify the full-width crop and thumbnail readability before integration.
- Prefer one thesis plus two or three value points; do not turn the cover into an abstract, table of contents, or API surface.

### Body visuals

- Prefer `16:9` or `8:5` for visuals expected to circulate independently in the feed.
- Use large labels, strong grouping, and useful alt text; assume readers may first see the visual outside the article body.
- Keep deterministic diagrams exact and rasterize to PNG if SVG handling is uncertain.

## Cross-Platform Plan

When one article targets both platforms:

1. Create one master visual concept and style fingerprint.
2. Produce separate cover crops when WeChat's wide/square requirements would weaken a CSDN or X thumbnail, or when X needs a self-contained title layer.
3. Keep body visuals shared where their legibility survives both editors.
4. Record platform-specific exports as separate manifest assets only when the files actually differ.

## Safe-Zone Checklist

- Does the focal subject survive a thumbnail?
- Does a central square crop retain the main idea?
- Does the final WeChat headline cover contain the exact approved title, unless the user explicitly opted out?
- Is exact title text rendered outside the image model?
- If a CSDN or X cover includes supporting points, are there no more than four and are they readable at thumbnail size?
- Are labels readable without opening the image full-screen?
- Are arrows distinguishable by more than color alone?
- Is there sufficient empty space around the visual hierarchy?
- Are logos, trademarks, and UI screenshots authorized and necessary?

## File Naming

Use stable, ordered, lowercase filenames:

```text
01-cover-csdn.png
01-cover-wechat.png
01-cover-x-article.png
02-concept-runtime-loop.png
03-diagram-approval-flow.png
04-architecture-policy-boundaries.png
```

Do not include prompt fragments, dates, temporary model IDs, or approval states in published filenames.
