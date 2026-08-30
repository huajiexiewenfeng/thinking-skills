[OUTPUT CONTRACT]
{
  "platform": "golden-reference",
  "aspect_ratio": "16:9",
  "occupancy": "the complete four-landmark three-gap graph occupies roughly eighty percent with no empty title field",
  "crop_rules": "all four landmarks and all three chevrons remain fully visible in the wide article crop",
  "output_count": 1
}

[ARTICLE SEMANTICS]
{
  "confirmed": [
    "The map contains exactly four stages in one order: origin, passage, evaluation, arrival.",
    "The only edges are origin to passage, passage to evaluation, and evaluation to arrival.",
    "There are no branches, merges, returns, loops, parallel paths, groups, or hierarchy claims."
  ],
  "simplifications": [
    "Render exactly four intentional natural terraces as landmarks A B C and D; surrounding mountains remain soft background and cannot resemble another terrace node.",
    "Render exactly three trail gaps AB BC and CD; put exactly one chevron at the midpoint of each gap and nowhere else.",
    "Keep every chevron off the landmark surfaces and do not subdivide any gap with an extra direction marker."
  ],
  "blocked": [
    "Do not add a fourth chevron a fifth landmark a second route a segment subdivision a route branch a return a crossing or a bidirectional marker.",
    "Do not add people animals vehicles buildings bridges roads with lane markings signs flags gates ruins portals cards boxes interfaces text numbers logos neon circuits isometric modules blueprint lines visible suns or data particles."
  ],
  "frozen_graph": {
    "nodes": [
      "origin",
      "passage",
      "evaluation",
      "arrival"
    ],
    "edges": [
      {
        "from": "origin",
        "to": "passage"
      },
      {
        "from": "passage",
        "to": "evaluation"
      },
      {
        "from": "evaluation",
        "to": "arrival"
      }
    ]
  }
}

[ROLE COMPOSITION]
{
  "stability": "strict",
  "instructions": {
    "structure": "wide 16:9 human-free cinematic landscape map in restrained 35 mm elevated perspective; four clearly shaped natural terrace landmarks form a clean zigzag A lower-left B center-left C center-right D upper-right; one continuous narrow pale-gold trail connects them; leave visible terrain gaps between landmarks and put exactly one dark chevron at the midpoint of gap AB exactly one at midpoint BC and exactly one at midpoint CD; no chevron sits on a landmark or elsewhere on the trail",
    "hierarchy": "the four landmarks remain equal semantic nodes while perspective supplies natural depth; the single trail and exactly three chevrons are the primary reading system; deep teal foreground muted blue middle terrain and a soft warm upper-right atmosphere preserve Style 6 without a visible sun",
    "human_elements": "none"
  },
  "must_preserve": [
    "preserve the frozen graph exactly including every landmark edge direction group invariant exception and return",
    "preserve fully human-free cinematic landscape-map perspective layered terrain landmark scale and one coherent horizon light",
    "preserve deterministic blank label zones one supported primary journey and restrained exception treatment"
  ],
  "may_vary": [
    "landmark count labels groups distance bands and route types may vary only as validated semantics requires",
    "terrain elevation may encode order or grouping only when the frozen semantics explicitly declares it",
    "landscape-map layout may adapt while every landmark route segment and direction remains visible"
  ]
}

[VISUAL DNA]
{
  "profile_id": "cinematic-conceptual",
  "style_pack_version": 3,
  "surface": {
    "background": "fully opaque cinematic narrative landscape with a layered teal-blue valley",
    "alternate": "desaturated blue-gray coastal plain or mountain basin using the same atmospheric depth grammar",
    "finish": "cinematic digital matte painting with restrained realism and no glossy photographic advertising polish"
  },
  "palette_roles": {
    "foreground": "deep desaturated teal based on #173A43 grounds the nearest terrain and human silhouette",
    "distance": "muted blue-gray based on #4F6973 separates successive mountain or valley layers",
    "journey": "one quiet pale road river trail or ridge line based on #B9C6C7 carries the narrative direction",
    "horizon_light": "a single warm golden horizon light based on #F2BC63 supplies the only dominant warm field",
    "digital_trace": "sparse low-luminance turquoise micro-traces based on #55C7B5 are optional only for confirmed technological themes"
  },
  "line_language": {
    "primary": "natural landscape silhouettes and one winding journey line replace diagram outlines",
    "paths": "one continuous road river trail or ridge enters from the foreground and leads toward the warm horizon without branches",
    "boundaries": "soft atmospheric terrain layers replace cards panels blueprint frames and infrastructure platforms"
  },
  "material_and_texture": {
    "surface": "painterly terrain rock vegetation mist and sky use restrained cinematic detail with no stock-photo sharpness",
    "human": "a small rear-view human silhouette uses simple matte clothing and never exposes a face or celebrity identity",
    "finish": "subtle atmospheric grain and soft edge separation with no chrome glass plastic neon or oversharpened texture"
  },
  "geometry": {
    "projection": "restrained 35 mm elevated wide perspective with a stable horizon and no fisheye distortion",
    "landscape": "foreground midground valley and distant horizon form four readable depth bands",
    "journey": "one winding journey line creates a strong foreground-to-horizon reading path",
    "human_scale": "one small rear-view human silhouette occupies roughly eight to twelve percent of image height when human presence is semantically supported",
    "focal_rule": "the journey line warm horizon and optional rear-view figure form one coherent narrative rather than competing symbols"
  },
  "depth_and_camera": {
    "mode": "restrained 35 mm elevated wide perspective looking across a layered valley or open landscape",
    "layers": "dark teal foreground muted blue midground pale atmospheric distance and warm horizon remain visibly separated",
    "lighting": "a single warm golden horizon light provides the only dominant warm source while cool ambient light preserves foreground detail",
    "atmosphere": "measured mist and aerial perspective connect terrain layers without hiding the road figure or horizon"
  },
  "typography": {
    "voice": "bold editorial Chinese headline with restrained English support applied through deterministic title overlay",
    "title_panel": "an optional dark translucent upper-left title panel is rendered deterministically after image generation",
    "exact_text": "titles subtitles and labels never come from image generation",
    "generated_text": "the generated background contains no readable text logos signage screens or watermarks"
  },
  "density_and_spacing": {
    "density": "low narrative density with one journey one horizon and at most one small human figure",
    "spacing": "the upper-left field remains readable for deterministic title overlay while the road and horizon keep the landscape active",
    "occupancy": "terrain layers fill the entire frame; no large empty black field and no tiny isolated subject"
  },
  "required_traits": [
    "cinematic narrative landscape reads through a complete foreground-to-horizon journey",
    "layered teal-blue valley or open terrain remains fully opaque and visually active across the frame",
    "restrained 35 mm elevated wide perspective preserves stable horizon scale and landscape depth",
    "one winding journey line leads from the foreground toward a single warm golden horizon light",
    "a small rear-view human silhouette may anchor scale and reflection without showing a face",
    "deterministic title overlay preserves exact typography while image generation remains text-free"
  ],
  "forbidden_traits": [
    "no generated title subtitle signage logo interface text or watermark",
    "no front-facing person visible face portrait close-up crowd dramatic pose or stock-model advertising",
    "no multiple roads branching paths multiple suns multiple warm focal lights or unrelated symbolic props",
    "no cosmic sky fantasy city glowing portal floating orb hologram neon circuitry transparent glass or science-fiction dashboard",
    "no isometric infrastructure modules blueprint construction flat infographic cards or node-box system grammar",
    "no random turquoise sparkles digital grid or data particles unless confirmed technological semantics explicitly supports them",
    "no empty dark fog crushed shadows oversaturated orange sky hyper-detailed stock photography or muddy painterly blur"
  ],
  "neighbor_boundaries": [
    {
      "profile_id": "neon-systems",
      "difference": "Style 6 uses a natural cinematic narrative landscape one journey one warm horizon and optional sparse semantic technology traces; Style 3 uses luminous circuitry transparent systems multiple technological relationships and neon atmosphere"
    },
    {
      "profile_id": "isometric-infrastructure",
      "difference": "Style 6 uses a restrained 35 mm elevated landscape perspective atmospheric terrain and human-scale narrative; Style 5 uses fixed isometric projection repeated modules explicit operational paths and architectural-system readability"
    },
    {
      "profile_id": "technical-editorial-minimal",
      "difference": "Style 6 is painterly atmospheric landscape-led and emotionally narrative; Style 1 is bright flat geometric grid-led and explanatory"
    }
  ]
}

[REFERENCE CONTRACT]
{
  "required_references": [
    {
      "id": "cinematic-conceptual-concept-v1",
      "kind": "bootstrap_candidate",
      "profile_id": "cinematic-conceptual",
      "role": "concept",
      "approval": "approved",
      "bootstrap_reference": true,
      "semantic_authority": false
    }
  ],
  "bootstrap_reference": true,
  "semantic_authority": false,
  "target_golden_asset_id": "cinematic-conceptual-diagram-v1",
  "must_preserve": [
    "preserve exact human-free cinematic landscape-map rendering with layered terrain large landmarks and readable route direction",
    "preserve one supported primary journey restrained exception treatment one warm horizon and deterministic blank label zones",
    "preserve painterly atmospheric depth without node cards isometric modules blueprint lines portals or neon systems"
  ],
  "may_vary": [
    "replace the complete example graph landmarks route terrain and depth grouping with the validated article-specific frozen graph",
    "vary landmark count terrain bands and explicit elevation only as frozen semantics requires"
  ],
  "must_not_copy": [
    "labels",
    "numbers",
    "nodes",
    "topology",
    "example_story"
  ],
  "example_content_authoritative": false
}

[TEXT POLICY]
{
  "mode": "text-free landscape with deterministic labels added later",
  "exact_text": [],
  "deterministic_overlay": true
}

[NEGATIVE CONSTRAINTS]
[
  "no generated title subtitle signage logo interface text or watermark",
  "no front-facing person visible face portrait close-up crowd dramatic pose or stock-model advertising",
  "no multiple roads branching paths multiple suns multiple warm focal lights or unrelated symbolic props",
  "no cosmic sky fantasy city glowing portal floating orb hologram neon circuitry transparent glass or science-fiction dashboard",
  "no isometric infrastructure modules blueprint construction flat infographic cards or node-box system grammar",
  "no random turquoise sparkles digital grid or data particles unless confirmed technological semantics explicitly supports them",
  "no empty dark fog crushed shadows oversaturated orange sky hyper-detailed stock photography or muddy painterly blur",
  "no people faces hands characters instructors narrators mascots crowds vehicles or stock imagery",
  "do not invent omit reverse merge split reroute hide or atmosphericly obscure any frozen semantic relationship",
  "do not copy golden labels numbers nodes topology landmarks terrain meaning or example story",
  "no node cards dashboards isometric infrastructure blueprint lines neon circuits portals fantasy spectacle or unsupported route",
  "Do not add a fourth chevron a fifth landmark a second route a segment subdivision a route branch a return a crossing or a bidirectional marker.",
  "Do not add people animals vehicles buildings bridges roads with lane markings signs flags gates ruins portals cards boxes interfaces text numbers logos neon circuits isometric modules blueprint lines visible suns or data particles."
]

[ACCEPTANCE CHECK]
[
  "every visible landmark edge direction group exception and return matches the frozen graph",
  "the map remains human-free fully opaque cinematic and legible at article width without becoming a technical node diagram",
  "the golden map contributes only lens palette depth atmosphere terrain landmark route and spacing grammar",
  "cinematic narrative landscape reads through a complete foreground-to-horizon journey",
  "layered teal-blue valley or open terrain remains fully opaque and visually active across the frame",
  "restrained 35 mm elevated wide perspective preserves stable horizon scale and landscape depth",
  "one winding journey line leads from the foreground toward a single warm golden horizon light",
  "a small rear-view human silhouette may anchor scale and reflection without showing a face",
  "deterministic title overlay preserves exact typography while image generation remains text-free"
]
