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
- Keep the essential subject and deterministic title within a central square-safe region so alternate crops remain meaningful.
- Extend background color and non-essential atmosphere to both sides.
- Test the full wide crop and a central square crop before approval.

### Body visuals

- Prefer a width of at least `1080 px` for raster body images when source quality permits.
- Use `16:9`, `3:2`, or `4:3` according to information density; consistency matters more than forcing one ratio.
- Keep important labels and arrows away from the outer 8% on all sides.
- Prefer PNG for diagrams and JPEG/PNG for illustration according to texture and file size.
- Avoid small captions baked into images; place explanatory text in Markdown whenever possible.

## Cross-Platform Plan

When one article targets both platforms:

1. Create one master visual concept and style fingerprint.
2. Produce separate cover crops when the wide WeChat crop would weaken the CSDN thumbnail or vice versa.
3. Keep body visuals shared where their legibility survives both editors.
4. Record platform-specific exports as separate manifest assets only when the files actually differ.

## Safe-Zone Checklist

- Does the focal subject survive a thumbnail?
- Does a central square crop retain the main idea?
- Is exact title text rendered outside the image model?
- Are labels readable without opening the image full-screen?
- Are arrows distinguishable by more than color alone?
- Is there sufficient empty space around the visual hierarchy?
- Are logos, trademarks, and UI screenshots authorized and necessary?

## File Naming

Use stable, ordered, lowercase filenames:

```text
01-cover-csdn.png
01-cover-wechat.png
02-concept-runtime-loop.png
03-diagram-approval-flow.png
04-architecture-policy-boundaries.png
```

Do not include prompt fragments, dates, temporary model IDs, or approval states in published filenames.
