# Style Catalog

Use these profiles as art-direction systems, not as rigid presets. Select one primary profile from the article's audience, tone, and information density. Keep one fingerprint across the entire visual set.

The seven named art-direction profiles below are the available visual submodes.

Never describe a profile as an imitation of a living artist. Convert user references into palette, geometry, material, lighting, perspective, and composition properties.

## Technical Editorial Minimal

Best for:

- broad technical audiences;
- explanatory CSDN posts;
- clean WeChat long-form articles;
- articles where diagrams and prose already carry substantial detail.

Fingerprint:

- off-white or deep-ink background;
- one restrained blue/cyan accent plus one warm highlight;
- flat geometric forms, crisp grids, generous negative space;
- editorial composition with a single strong focal metaphor;
- soft ambient light, low texture, no decorative circuitry.

Avoid:

- crowded dashboards;
- tiny interface labels;
- generic stock-photo people;
- excessive glow.

Prompt fragment:

```text
technical editorial minimalism, restrained ink-blue and cyan palette, crisp geometric hierarchy, generous negative space, subtle paper or matte texture, one clear focal metaphor, clean publication-quality composition
```

## White-Green Editorial Minimal

Best for:

- WeChat technology commentary and AI industry analysis;
- a bright, rational, premium editorial tone without dark cyberpunk styling;
- wide covers built around a clear tension, comparison, or three-part system.

Fingerprint:

- white or very pale mint background;
- restrained emerald and forest-green hierarchy, with optional small cyan-green accents;
- flat geometric forms, crisp thin-to-medium lines, soft matte depth, little or no glow;
- one dominant semantic nucleus with supporting structures extending horizontally;
- generous but active negative space that separates groups rather than emptying the canvas;
- brand-neutral, publication-grade composition with no decorative UI.

Wide-cover composition contract:

- for a balanced or three-part `2.35:1` cover, let the intentional foreground hierarchy occupy roughly 70–90% of the canvas width;
- keep the semantic nucleus and primary title meaningful in the central square crop, but allow supporting structures to extend beyond it;
- use both outer bands for meaningful continuation of the article's left/right forces, not decorative filler;
- reject a layout that confines the complete title and foreground system to the central square while leaving both sides as background-only whitespace.

Avoid:

- pale green elements with insufficient contrast on white;
- ornamental leaves or generic sustainability imagery;
- shrinking the whole composition merely to satisfy square-crop safety;
- excessive glow, glassmorphism, dense circuitry, or tiny labels.

Prompt fragment:

```text
white-green editorial minimalism, bright white or pale mint ground, restrained emerald and forest-green hierarchy, crisp flat geometric forms, subtle matte depth, one clear semantic nucleus, supporting structures spanning the wide canvas, active negative space, premium technology publication quality, no decorative UI or excessive glow
```

## Neon Systems

Best for:

- AI agents, runtimes, distributed systems, observability, and developer infrastructure;
- high-energy covers that still need clear hierarchy.

Fingerprint:

- navy/black foundation with cyan and controlled acid-green accents;
- luminous paths, glass-like layers, precise modular geometry;
- cinematic depth with one bright focal route;
- central subject isolated from background complexity.

Avoid:

- cyberpunk city clichés;
- random code text;
- uncontrolled magenta rainbow palettes;
- illegible HUD decoration.

Prompt fragment:

```text
dark technical systems aesthetic, navy foundation, controlled cyan and acid-green signal paths, precise modular geometry, subtle glass layers, cinematic depth, high contrast focal route, no readable text or HUD clutter
```

## Blueprint Linework

Best for:

- architecture boundaries;
- component anatomy;
- infrastructure explanations;
- visuals that bridge concept illustration and exact diagram.

Fingerprint:

- deep blueprint blue or warm drafting-paper background;
- thin high-contrast construction lines;
- orthographic or cutaway view;
- measured spacing, restrained annotation zones;
- minimal shading and no photorealism.

Avoid:

- fake measurements;
- pseudo-engineering labels;
- dense crosshatching at article-column size.

Prompt fragment:

```text
architectural blueprint linework, disciplined orthographic construction, deep blue ground with clean pale lines, sparse cyan highlights, measured spacing, technical but uncluttered, no invented labels or dimensions
```

## Isometric Infrastructure

Best for:

- cloud platforms;
- service ecosystems;
- deployment and data-pipeline concepts;
- articles that benefit from tangible spatial organization.

Fingerprint:

- clean isometric modules on a simple ground plane;
- matte materials with soft directional light;
- limited brand-neutral palette;
- one visible path or state transition;
- consistent scale and camera angle.

Avoid:

- literal vendor logos unless authorized;
- too many miniature servers;
- topology that implies unsupported connections.

Prompt fragment:

```text
clean isometric technical infrastructure, modular matte components, consistent scale, soft directional lighting, restrained blue and warm accent palette, one legible system path, spacious publication layout
```

## Cinematic Conceptual

Best for:

- strategic or philosophical technology essays;
- a cover built around one memorable metaphor;
- transitions about control, uncertainty, trust, or emergence.

Fingerprint:

- one symbolic subject in a large atmospheric environment;
- dramatic but controlled light;
- high depth separation;
- limited palette with a single accent;
- generous title-safe negative space.

Avoid:

- vague spectacle with no relation to the thesis;
- faces as the default focal point;
- embedded title text from the image model.

Prompt fragment:

```text
cinematic conceptual editorial illustration, one precise symbolic subject, atmospheric depth, controlled dramatic light, limited palette, strong silhouette, generous clean negative space for deterministic title layout, no text
```

## Soft Technical Sketch

Best for:

- tutorials and learning-oriented explanations;
- approachable mental models;
- articles that should feel handcrafted rather than corporate.

Fingerprint:

- warm paper ground;
- ink or pencil contours with muted watercolor accents;
- simple objects and friendly spatial metaphors;
- visible but disciplined imperfection;
- low visual density.

Avoid:

- childish mascots unless requested;
- handwritten technical labels;
- inconsistent object proportions across the series.

Prompt fragment:

```text
soft technical sketch on warm paper, clean ink contours, muted watercolor accents, approachable visual metaphor, disciplined hand-drawn texture, low density, generous margins, no handwritten labels
```

## Selection Heuristic

| Article signal | Prefer |
|---|---|
| Dense tutorial, broad audience | Technical Editorial Minimal |
| WeChat technology commentary, bright rational tone | White-Green Editorial Minimal |
| AI/runtime/infrastructure launch tone | Neon Systems |
| Boundary or component anatomy | Blueprint Linework |
| Cloud/service ecosystem | Isometric Infrastructure |
| Thesis-led strategic essay | Cinematic Conceptual |
| Beginner-friendly teaching | Soft Technical Sketch |

When two signals conflict, prefer the lower-density profile for body illustrations. Covers may be more expressive, but they must retain the same palette and geometry cues as the body set.
