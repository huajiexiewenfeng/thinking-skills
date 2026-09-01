# Style Selection Golden Preview Design

## Problem

The article visual workflow currently presents nine bilingual Style options as text only. A user must infer the actual visual result from short descriptions, which makes style selection slower and less reliable even though every registered Style already has an approved golden cover.

## Decision

The mandatory nine-Style selection gate will render one approved golden cover immediately after each Style's bilingual name and description. The response remains a vertical sequence of nine image-and-text cards because this layout is the most reliable across hosts and does not depend on table thumbnail rendering.

## Data Source

Before presenting the menu, the Skill may read:

1. `references/style-registry.json`;
2. each registered profile's `golden_set_path`;
3. only the cover entry from each golden set.

This is a narrow preview exception to the selected-profile loading rule. It does not permit loading or blending all nine protocols, token files, Visual DNA files, role contracts, reference matrices, prompts, concept images, or diagram images before selection.

## Eligibility

A cover is previewable only when all of the following are true:

- the golden set has `status=approved`;
- `user_approval.status=approved`;
- exactly one asset has `role=cover`;
- the artifact exists at the registered Skill-relative path;
- its SHA-256 matches `artifact_sha256`.

If a cover fails any check, keep the Style in the complete nine-item menu and show `黄金图暂不可用` beneath it. Never substitute a candidate image, another role, another Style's image, an article-specific image, or a newly generated image.

## Rendering Contract

Use the host's native local-image preview capability. In Codex, resolve the cover to an absolute filesystem path rooted at the loaded Skill and render it with Markdown image syntax. Do not emit unresolved relative paths, invent web URLs, or copy the golden asset into an article workspace merely to show the menu.

Each item has this shape:

```text
N. English Name（中文名）— concise suitability description.
![N. English Name 黄金图](<resolved absolute local cover path>)
```

After all nine cards, show the article-specific recommendation when available and ask the user to reply with the number, English name, or Chinese name.

## Workflow Boundary

The preview changes presentation only. The gate still stops after the nine-item menu and waits for explicit Style selection. Previewing a golden cover does not approve a Style, visual plan, permanent golden migration, article style anchor, prompt, manifest, or generated asset.

## Validation

Contract tests must fail before implementation and pass only when the Skill:

- requires one cover preview per registered Style;
- resolves previews from registry and approved golden-set metadata;
- verifies approval, existence, role uniqueness, and artifact hash;
- defines the exact unavailable fallback without substitution;
- limits pre-selection loading to registry and golden cover metadata;
- preserves the complete nine-item menu and explicit-selection stop gate.

The full article-visual-director suite, Style Pack release validation, quick validation, benchmark case loading, and a clean staged-snapshot verification remain release gates.

## Scope

This change does not alter the nine Style identities, any golden asset, Style 8 human policy, density selection, visual planning, rendering, integration, or the excluded fourth article.
