# Style Protocol Schema

Every article visual profile is a versioned visual contract shared by image generation and deterministic rendering. Canonical identity and file paths live in `style-registry.json`; a protocol may refine behavior but may not rename, reorder, or silently merge profiles.

## Required Protocol Headings

Every protocol Markdown file must contain these level-two headings exactly once and in this order:

1. `Identity`
2. `Use When`
3. `Do Not Use When`
4. `Mode Boundary`
5. `Required Visual Traits`
6. `Allowed Variation`
7. `Forbidden Traits`
8. `Cover Contract`
9. `Concept Contract`
10. `Deterministic Diagram Contract`
11. `Imagegen Prompt Contract`
12. `Reference Use Contract`
13. `Validation Rubric`

## Identity Contract

`Identity` declares `profile_id`, protocol version, English name, Chinese name, and the profile's one-sentence visual promise. These values must match the registry.

## Boundary Contract

`Mode Boundary` names the nearest neighboring mode and gives observable rules for distinguishing them. `Required Visual Traits` and `Forbidden Traits` are normative; generic adjectives without visible evidence are insufficient.

## Asset Contracts

`Cover Contract`, `Concept Contract`, and `Deterministic Diagram Contract` define the stable family resemblance for three semantic jobs. They may vary composition, but must preserve the same surface, palette roles, line behavior, geometry, depth, texture, and typography family.

The deterministic contract maps at least node fill, boundary stroke, arrow, label tab, typography, paper/background, and spacing to keys in the profile token file.

## Image Generation Contract

`Imagegen Prompt Contract` specifies objective, subject or metaphor, composition, line and material behavior, semantic palette roles, aspect ratio, reference-preservation rules, and negative constraints. Image generation must not be asked to spell exact titles or technical labels when deterministic typography can do so.

## Reference Contract

`Reference Use Contract` defines how one to three approved golden assets are attached and which visible properties each asset anchors. References are evidence for composition and visual grammar, not permission to imitate a living artist.

## Validation Contract

`Validation Rubric` contains observable pass/fail criteria for identity, composition, palette, line, geometry, renderer consistency, legibility, and prohibited drift. Release validation requires three user-approved golden assets: cover, concept, and diagram.

## Token File Contract

Each sibling `*.tokens.json` file uses `protocol_version: 2`, repeats the matching `profile_id`, and provides these top-level keys: `surface`, `palette`, `line`, `typography`, `geometry`, `depth`, `texture`, `spacing`, `semantic_color_roles`, and `forbidden_traits`.

Token values are renderer-neutral. CSS hex colors and numeric pixel values target a 1600×900 master unless a platform profile overrides canvas dimensions.
