# Style Catalog

Use this catalog to choose a profile; use the linked protocol as the normative visual contract. Profile identity, order, and file paths are locked by [`style-registry.json`](style-registry.json). Publication colors are context only and must not replace the selected profile's palette roles.

| # | Profile | 中文名 | Best fit | Protocol |
|---:|---|---|---|---|
| 1 | Technical Editorial Minimal | 技术编辑简约 | Dense technical explanation for a broad audience | [`01-technical-editorial-minimal.md`](styles/01-technical-editorial-minimal.md) |
| 2 | White-Green Editorial Minimal | 白底绿色编辑简约 | Bright, rational WeChat technology commentary | [`02-white-green-editorial-minimal.md`](styles/02-white-green-editorial-minimal.md) |
| 3 | Neon Systems | 霓虹系统科技 | AI runtimes, agents, observability, and infrastructure launches | [`03-neon-systems.md`](styles/03-neon-systems.md) |
| 4 | Polished Tech Explainer | 质感科技图解 | AI systems, product architecture, polished technology visuals, rich technical explainers, and precise process diagrams | [`04-blueprint-linework.md`](styles/04-blueprint-linework.md) |
| 5 | Isometric Infrastructure | 等距基础设施 | Cloud platforms, service ecosystems, and spatial pipelines | [`05-isometric-infrastructure.md`](styles/05-isometric-infrastructure.md) |
| 6 | Cinematic Conceptual | 电影感概念视觉 | Thesis-led strategic or philosophical essays with one metaphor | [`06-cinematic-conceptual.md`](styles/06-cinematic-conceptual.md) |
| 7 | Soft Technical Sketch | 柔和技术手绘 | Tutorials and approachable teaching metaphors | [`07-soft-technical-sketch.md`](styles/07-soft-technical-sketch.md) |
| 8 | Handwritten Systems Explainer | 手写系统解释图 | Agent/runtime trade-offs, before/after systems, and compact operational ideas | [`08-handwritten-systems-explainer.md`](styles/08-handwritten-systems-explainer.md) |
| 9 | Dense Technical Infographic | 高密度技术信息图 | Text-bearing framework mechanisms, middleware internals, network protocols, concurrency models, and system architecture tutorials | [`09-dense-technical-infographic.md`](styles/09-dense-technical-infographic.md) |

Dense Technical Infographic is the flat, front-facing, text-bearing engineering-poster mode. It is denser and more explicitly instructional than Style 1, avoids Style 4's polished glass-acrylic product depth, avoids Style 5's isometric spatial world, and uses crisp sans-serif vector-like geometry instead of Style 8's warm handwritten paper language.

## Selection Heuristic

| Article signal | Prefer |
|---|---|
| Dense tutorial, broad audience | Technical Editorial Minimal |
| WeChat technology commentary, bright rational tone | White-Green Editorial Minimal |
| AI/runtime/infrastructure launch tone | Neon Systems |
| Polished technology product visual or rich enterprise process | Polished Tech Explainer |
| Cloud/service ecosystem | Isometric Infrastructure |
| Thesis-led strategic essay | Cinematic Conceptual |
| Beginner-friendly teaching | Soft Technical Sketch |
| Agent/runtime trade-off or before/after explanation | Handwritten Systems Explainer |
| Framework mechanism, middleware internals, protocol flow, or concurrency model | Dense Technical Infographic |

When two signals conflict, prefer the lower-density profile for body illustrations. Covers may be more expressive, but they must retain the selected profile's palette roles, geometry, line behavior, and material cues.
