# Freeform Art Direction

`mode_id`: `article-local-freeform`

Use this mode when the user wants the AI to create a fresh visual language for one article and keep the resulting series coherent. It is an article-local mode, not a tenth permanent Style Pack.

## Core contract

- Start each new article without a permanent golden, registered protocol, inherited palette, or previous article anchor.
- Derive one proposed direction from the current article's thesis, audience, tone, information density, and platform. Describe observable choices rather than labels such as “premium” or “modern”.
- Keep the ordinary visual-plan approval gate. Generate one representative anchor only after that plan is approved.
- The first approved anchor becomes the article continuity reference. Before rendering another asset, freeze an `article-local visual brief` beside the article and bind it to the source article hash and anchor artifact hash.
- Reset for every new article. Never promote the article-local brief or anchor to a permanent profile or golden without a separate explicit maintenance request.

## Article-local visual brief

The UTF-8 JSON brief records `mode_id`, `direction_id`, `direction_revision`, `source_article_sha256`, `anchor_asset_id`, `anchor_artifact_sha256`, observable `visual_dna`, role-specific contracts, deterministic tokens, and a non-authoritative reference policy. Visual DNA covers surface, palette roles, line language, material and texture, geometry, depth and camera, typography, density and spacing, required traits, forbidden traits, and allowed variation.

An approved revision is immutable. Replacing the anchor, changing the visual direction, or materially changing the source article creates a new revision and requires approval again. A rejected candidate is never a continuity reference.

## Rendering

- The anchor may use image generation when its role allows it. It receives no permanent style reference.
- Every later image-generation asset receives both the approved anchor and the frozen brief. The anchor has `semantic_authority=false`; its labels, numbers, nodes, arrows, topology, and example story are never inherited.
- Exact publication copy uses deterministic typography. This mode does not inherit Style 9 native-copy generation.
- Process, architecture, comparison, timeline, and boundary visuals use `deterministic-diagram`; quantitative visuals use `deterministic-chart`. Map their tokens from the frozen brief so deterministic assets belong to the same series.
- One-asset work treats that asset as both candidate anchor and final asset, but it still needs user approval before integration.

## Safety and validation

Visual freedom never authorizes invented facts, copy, nodes, arrows, numbers, boundaries, sequence, data flow, or causality. Freeze the article-specific semantic graph before technical rendering. Keep publication-theme changes separate from article-local Visual DNA.

Validate each asset against the brief and first approved anchor for surface, palette roles, line/material behavior, geometry, depth, typography, spacing, forbidden traits, and series continuity. Hash drift in the article, brief, or anchor invalidates downstream generation and integration until the affected revision is reviewed again.
