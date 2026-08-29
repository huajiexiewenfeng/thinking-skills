# Style Catalog

Use this catalog to choose a profile; use the linked protocol as the normative visual contract. Profile identity, order, and file paths are locked by [`style-registry.json`](style-registry.json). Publication colors are context only and must not replace the selected profile's palette roles.

| # | Profile | 中文名 | Best fit | Protocol |
|---:|---|---|---|---|
| 1 | Technical Editorial Minimal | 技术编辑简约 | Dense technical explanation for a broad audience | [`01-technical-editorial-minimal.md`](styles/01-technical-editorial-minimal.md) |
| 2 | White-Green Editorial Minimal | 白底绿色编辑简约 | Bright, rational WeChat technology commentary | [`02-white-green-editorial-minimal.md`](styles/02-white-green-editorial-minimal.md) |
| 3 | Neon Systems | 霓虹系统科技 | AI runtimes, agents, observability, and infrastructure launches | [`03-neon-systems.md`](styles/03-neon-systems.md) |
| 4 | Blueprint Linework | 蓝图线稿 | Boundaries, anatomy, cutaways, and architectural explanation | [`04-blueprint-linework.md`](styles/04-blueprint-linework.md) |
| 5 | Isometric Infrastructure | 等距基础设施 | Cloud platforms, service ecosystems, and spatial pipelines | [`05-isometric-infrastructure.md`](styles/05-isometric-infrastructure.md) |
| 6 | Cinematic Conceptual | 电影感概念视觉 | Thesis-led strategic or philosophical essays with one metaphor | [`06-cinematic-conceptual.md`](styles/06-cinematic-conceptual.md) |
| 7 | Soft Technical Sketch | 柔和技术手绘 | Tutorials and approachable teaching metaphors | [`07-soft-technical-sketch.md`](styles/07-soft-technical-sketch.md) |
| 8 | Handwritten Systems Explainer | 手写系统解释图 | Agent/runtime trade-offs, before/after systems, and compact operational ideas | [`08-handwritten-systems-explainer.md`](styles/08-handwritten-systems-explainer.md) |

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
| Agent/runtime trade-off or before/after explanation | Handwritten Systems Explainer |

When two signals conflict, prefer the lower-density profile for body illustrations. Covers may be more expressive, but they must retain the selected profile's palette roles, geometry, line behavior, and material cues.
