# Isometric Infrastructure

## Identity

- `profile_id`: `isometric-infrastructure`
- Protocol version: `2`
- 中文名: 等距基础设施
- Promise: make a service ecosystem tangible through one consistent isometric world, scale, and operational path.

## Use When

Use for cloud platforms, service ecosystems, deployments, data pipelines, and topics whose topology benefits from spatial organization.

## Do Not Use When

Do not use for strict architecture boundaries, emotional metaphor, flat comparisons, or systems whose topology is uncertain or unsupported by the article.

## Mode Boundary

The nearest neighbor is Blueprint Linework. This mode requires a fixed 30-degree isometric camera, matte solid modules, consistent scale, and directional light; Blueprint is flat, orthographic, thin-line construction.

## Required Visual Traits

- Fixed isometric camera, consistent module scale, matte materials, restrained blue modules, and one amber active transition.
- A simple ground plane, soft directional shadow, spacious grouping, and one legible path through the spatial system.
- Every connection must be supported by the article; brand-neutral forms replace vendor logos.

## Allowed Variation

Modules may represent services, stores, queues, devices, or stages. Elevation may encode hierarchy if the meaning is explicit and the camera/scale remain consistent.

## Forbidden Traits

No random perspective, mixed camera angles, miniature server clutter, vendor logos, unsupported topology, glossy toy rendering, or multiple competing routes.

## Cover Contract

Use one isometric environment with a single visible journey from source to destination. Preserve a title-safe zone while keeping the spatial world large enough to read at thumbnail size.

## Concept Contract

Represent two to five spatial modules and one supported path. Use scale and placement to clarify ownership or sequence, never to invent importance.

## Deterministic Diagram Contract

Map canvas/plane to `surface`, module faces to `semantic_color_roles.module`, active path to `active_transition`, edges/text to `edge`, inactive modules to `inactive`, plaques to `geometry.label_style`, and placement to the 32 px grid projected through the fixed `isometric-30deg` camera. Shadows share one direction and softness.

## Imagegen Prompt Contract

State objective, exact supported modules and connections, fixed 30-degree isometric composition, consistent scale, matte materials, blue system modules, one amber path, soft directional light, target aspect ratio, and text-free output. References anchor camera, scale, material, and path visibility. Negatives: logos, random perspective, server clutter, extra connections, glossy toys, multiple light directions, and readable labels.

## Reference Use Contract

Use the cover reference for world scale and crop, concept reference for module abstraction, and diagram reference for camera projection, edge, shadow, plaque, and semantic path tokens. References never authorize invented topology.

## Validation Rubric

Pass only if the camera is consistent, modules share scale/material, exactly one path dominates, all connections are source-backed, labels are deterministic, depth reads without clutter, and no blueprint, photoreal, or toy-like drift appears.
