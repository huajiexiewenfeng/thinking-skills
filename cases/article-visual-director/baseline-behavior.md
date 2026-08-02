# Article Visual Director Baseline

## Environment

- Skill present: no
- Test mode: three fresh-context application scenarios
- Date: 2026-08-02

## Scenario A: Stable CSDN Article

### Prompt

> 这是一篇已经定稿的 CSDN Markdown 技术文章。请给它设计封面和三个重要小节的概念配图，先给完整的主题、构图和 Prompt，确认后再生成，并插回新的 Markdown 副本。

### Raw Response

> 可以。请把已定稿的 Markdown 文件上传，或告诉我它在当前工作区中的路径。
>
> 我会先阅读文章并提交一份完整视觉方案，包括：
>
> - 1 张封面：主题、视觉隐喻、构图、配色、标题留白和生成 Prompt
> - 3 张重点小节概念图：对应小节、表达目标、构图与生成 Prompt
> - 统一的视觉风格、画幅比例及插图位置建议
>
> 这一阶段只做方案，不生成图片、不修改原文。等你确认后，我再生成图片，并复制出一份新的 Markdown，将图片插入合适位置，原文件保持不变。

### Observed Result

- The baseline already respects the plan-before-generation gate.
- The baseline already promises a non-destructive Markdown copy.
- No corrective rule is needed for these two behaviors.
- It does not define a persisted manifest, renderer contract, validation evidence, or idempotent insertion mechanism.

## Scenario B: Exact Process and Architecture

### Prompt

> 这篇公众号文章重点解释 Gateway -> Runtime -> Tool Approval -> Result 的流程，以及 Runtime、Policy、Tool Registry 三层边界。请规划配图。流程和边界必须准确，不要把密集技术文字交给图片模型。

### Raw Response

> 建议采用“1 张首图 + 2 张核心技术图 + 2 张轻量辅助图”，重点靠矢量图形和后期排版表达，不让图片模型生成技术文字。
>
> ### 1. 首图：一次工具调用如何穿过系统
>
> - 画面：请求像一束信号，依次穿过 Gateway、Runtime、Approval Gate，最终抵达 Tool，再带回 Result。
> - 构图：横向流程，适合公众号封面裁切。
> - 文案只保留标题：`从 Gateway 到 Result`
> - 注意：Approval Gate 画成“条件闸门”，避免误导为每次调用都必须人工批准。
> - 制作：图片模型只生成科技感背景与抽象节点；名称、箭头、标题后期添加。
>
> ### 2. 核心流程图：工具调用时序
>
> 建议正文用可编辑的 SVG/Figma 绘制：
>
> ```text
> Request
>   ↓
> Gateway
>   ↓ 认证、路由、上下文接入
> Runtime
>   ├─ 查询 Tool Registry：工具是否存在、如何调用
>   ├─ 交给 Policy：本次调用是否允许
>   │     ├─ 允许 → 执行 Tool
>   │     ├─ 需批准 → Tool Approval → 执行或拒绝
>   │     └─ 拒绝 → 返回拒绝结果
>   ↓
> Tool Result
>   ↓
> Runtime 整理结果
>   ↓
> Gateway 返回响应
> ```
>
> 视觉上把“Tool Approval”画成 Policy 判断后的条件分支，而不是 Runtime 与 Result 之间无条件存在的一站。这是准确性的关键。
>
> ### 3. 核心边界图：Runtime、Policy、Tool Registry 三层职责
>
> 采用三列或三层架构图：
>
> | 边界 | 核心职责 | 不应画成 |
> |---|---|---|
> | Runtime | 编排调用、维护执行上下文、处理工具结果 | 最终授权者 |
> | Policy | 判断允许、拒绝或要求批准 | 工具目录或执行器 |
> | Tool Registry | 声明工具能力、参数和调用入口 | 权限审批系统 |
>
> 三者关系建议画成：
>
> ```text
> Runtime ──查能力──▶ Tool Registry
> Runtime ──请求判定──▶ Policy
> Policy ──必要时──▶ Tool Approval
> Runtime ──获准后──▶ Tool Execution
> ```
>
> 不要把三层画成简单的上下堆叠调用链；它们是不同职责边界，Runtime 才是编排中心。
>
> ### 4. 辅助图：批准闸门的三种结果
>
> 用三个大图标表达：
>
> - 绿色通道：直接允许
> - 黄色闸门：等待用户批准
> - 红色阻断：策略拒绝
>
> 每个图标只放 2–4 个字，详细条件写在正文或图注中。
>
> ### 5. 辅助图：Result 的回程
>
> 画一个简洁的回环：
>
> ```text
> Tool → 原始结果 → Runtime 解析/整合 → Gateway → 用户
> ```
>
> 用于强调 Result 并非工具直接越过 Runtime 返回给用户；错误、拒绝和取消也都属于结果路径。
>
> 统一视觉可使用深蓝背景、青色数据流、黄色审批节点、红色拒绝分支。所有协议名、职责说明、参数和箭头标签均应后期用矢量文字排版；图片模型只负责背景、质感和非语义装饰。

### Observed Failures

- It correctly prefers editable technical diagrams over raster-generated labels.
- It silently adds authentication, routing, registry lookup, policy outcomes, tool execution, error, rejection, and cancellation details that were not confirmed in the prompt.
- It presents those inferred relationships as facts rather than assumptions requiring confirmation.
- It does not produce a complete Prompt/diagram manifest or an explicit approval state.

## Scenario C: Safe Markdown Insertion

### Prompt

> 请把已验证的图片插入 article.md。保留 UTF-8 BOM、CRLF、frontmatter、代码块和已有图片；重复执行不能再次插入，也不能覆盖原文。

### Raw Response

> 可以，但当前缺少“已验证图片”的路径及其插入位置，无法安全修改。请提供图片清单与对应段落/标题；我会保持 UTF-8 BOM、CRLF、frontmatter、代码块和现有图片不变，并做幂等检查，确保重复执行不会再次插入或覆盖原文。

### Observed Result

- It correctly refuses to guess missing asset paths and anchors.
- It states the desired preservation properties but provides no executable validation, source digest, marker contract, or evidence that repeated application is idempotent.

## Failure Pattern

The base model already has good editorial instincts. The reusable gap is not “remember to ask first”; it is the lack of an evidence-bound fact model and deterministic handoff from approved plan to validated assets and idempotent Markdown mutation. The skill should preserve natural judgment while adding that contract.

## With-Skill Forward Evidence

After implementation, three fresh agents loaded the completed skill and its required references without receiving the baseline answers. The exact prompts, decision-critical verbatim excerpts, and observed checks are recorded in [forward-behavior.md](forward-behavior.md).

All three gates passed:

- a full article request stopped after a complete visual rhythm, prompts/specifications, semantic ledger, manifest state, and approval request;
- an architecture request with unknown directions produced a deterministic no-arrow boundary diagram and blocked every unconfirmed edge;
- a request with no manifest that asked to overwrite the source was refused and redirected to a hash-checked, idempotent illustrated copy.
