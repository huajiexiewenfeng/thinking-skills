# Polished Tech Explainer — Deterministic Diagram Render Contract

Renderer: deterministic SVG rasterized to fully opaque PNG.

Frozen graph:

- Nodes: intake, framing, execution, verification, stable-result, recovery.
- Primary edges: intake → framing → execution → verification → stable-result.
- Exception edge: verification → recovery.
- Return edge: recovery → framing.
- Stable result is reachable only from verification.
- Recovery receives only from verification and returns only to framing.

Visual contract:

- Cool-white fully opaque canvas with faint blue grid.
- Blank eyebrow, title, subtitle, group, index, node-label, caption, and explanatory-strip zones for later deterministic text.
- Five equal primary cards in one horizontal row and one recovery card below.
- Four solid cobalt primary arrows, one dashed amber exception arrow, and one dashed gray-blue return arrow.
- Exactly one destination arrowhead per semantic edge.
- Teal appears only in stable result; amber appears only in recovery.
- Information-design placeholders and decorative circles are non-semantic and receive no arrows.
- No people, generated text, extra nodes, extra edges, shortcuts, legends, or copied topology.

Deterministic final copy:

- Eyebrow: `VERIFIED DELIVERY LOOP`
- Title: `验证先于交付`
- Subtitle: `主流程自动推进，失败检查进入恢复并返回任务界定`
- Group labels: `PRIMARY DELIVERY`, `RECOVERY`
- Nodes: `输入收集`, `任务界定`, `方案执行`, `结果验证`, `稳定结果`, `恢复返工`
- Captions: `接收目标与材料`, `明确范围与约束`, `在约束内执行`, `检查准确与完整`, `验证通过后交付`, `修正后返回界定`
- Footer: `验证失败 → 进入恢复；恢复完成 → 返回任务界定；不允许绕过验证直接交付`
