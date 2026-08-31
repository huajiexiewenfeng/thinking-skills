# Style Pack v3 Schema

Style Pack v3 is the machine-readable visual contract for one registered article visual profile. It augments the human-readable protocol and deterministic token file; it does not replace either one.

## Activation

A registry entry activates v3 only when `style_pack_version` is `3` and declares safe Skill-relative paths for `visual-dna.json`, `role-contracts.json`, and `reference-matrix.json`. Profiles without this field remain on the legacy protocol path. Do not infer or partially load a v3 pack.

## Visual DNA

`visual-dna.json` contains exactly one profile's cross-role invariants. Required top-level keys:

- `profile_id`
- `style_pack_version`
- `surface`
- `palette_roles`
- `line_language`
- `material_and_texture`
- `geometry`
- `depth_and_camera`
- `typography`
- `density_and_spacing`
- `required_traits`
- `forbidden_traits`
- `neighbor_boundaries`

Identity and version must match the registry. Trait lists contain observable statements, not unsupported adjectives such as “beautiful” or “professional”. `neighbor_boundaries` names the nearest profile and states visible differences.

## Role Contracts

`role-contracts.json` contains `profile_id`, `style_pack_version`, and `roles` with exactly `cover`, `concept`, and `diagram`.

- `cover.stability` is `family`: preserve Visual DNA, hierarchy, occupancy, and crop survival while allowing subject and composition changes.
- `concept.stability` is `family`: preserve Visual DNA, narrative density, semantic color roles, and annotation language while allowing metaphor and reading-path changes.
- `diagram.stability` is `strict`: preserve grid, node geometry, boundary, arrow, legend, and spacing rules. Nodes and topology come only from the frozen article semantic graph.

Every role declares non-empty `must_preserve`, `may_vary`, `must_not_include`, and `acceptance_checks` arrays.

## Native Generated Copy Exception

Exact copy uses deterministic typography by default. Only the registered `dense-technical-infographic` profile may declare native generated copy. Its copy ledger must be frozen before generation, and exact post-generation text validation is mandatory. This exception governs visible text, not runtime selection: image generation still defaults to the built-in host-managed `image_gen` capability, with no API key and no forced model alias. A `gpt-image-2` CLI/API fallback is permitted only after explicit user approval. Technical diagrams additionally retain the frozen semantic graph requirement.

Correct native copy is preserved. One isolated copy defect may use a deterministic local correction; multiple-copy, numeric, grouping, direction, or topology defects require regeneration or deterministic rebuild. A validation failure never authorizes accepting wrong copy or weakening the graph.

## Reference Matrix

`reference-matrix.json` contains `profile_id`, `style_pack_version`, and `references`. There is exactly one entry for each approved golden role. Each entry contains:

- `golden_asset_id`
- `role`
- `must_preserve`
- `may_vary`
- `must_not_copy`

Every `must_not_copy` includes `labels`, `numbers`, `nodes`, `topology`, and `example_story`. Golden assets provide visual evidence only and never supply article facts.

## Golden Set Qualification

An approved v3 golden set records SHA-256 values for the three pack JSON files and a `qualification` object:

```json
{
  "prompt_compile_status": "passed",
  "cross_topic_probe_status": "passed",
  "neighbor_discrimination_status": "passed"
}
```

Protocol validation accepts a v3 pack whose probe fields are pending. Release validation fails closed until all three statuses are `passed`, all three permanent golden roles are approved, and every declared hash matches.

## Golden Candidate Bootstrap

Before a candidate profile has permanent role goldens, its first cover is compiled from Visual DNA and the cover role contract without an image reference. After that cover is explicitly approved, one prior same-profile candidate may temporarily anchor the concept; after concept approval, one prior same-profile candidate may temporarily anchor the diagram. These temporary links declare `bootstrap_reference: true` and `semantic_authority: false`. Cross-profile bootstrap and article-anchor bootstrap are invalid.

## Theme and Semantic Boundary

`publication_theme` may affect only fields allowed by the selected theme override policy. It cannot mutate Visual DNA. `asset_semantics` and a frozen diagram graph are the only sources for article-specific subjects, claims, labels, nodes, edges, numbers, groups, or topology.
