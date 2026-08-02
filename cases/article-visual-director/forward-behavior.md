# Article Visual Director With-Skill Forward Evidence

Date: 2026-08-02

Method: three independent agents loaded `skills/article-visual-director/SKILL.md` and its directly required references. They were instructed not to mutate files or generate images. The excerpts below are verbatim and preserve every decision used for the pass/fail judgment.

## Scenario A: Full Plan Before Generation

### Prompt

> 下面是一篇已定稿、准备同时发 CSDN 和公众号的 Markdown。请给它规划封面和两个概念配图，确认后生成并插入新副本。
>
> # Agent Runtime 为什么需要审批边界
>
> Runtime 不应默认拥有所有工具权限。它先组合上下文，再根据策略决定是否需要用户批准。
>
> ## 执行循环
>
> 模型提出工具调用，Runtime 校验请求并驱动执行，结果返回模型继续推理。
>
> ## 审批的意义
>
> 审批不是装饰，而是把高风险动作交还给用户决定。

### Decision-Critical Verbatim Excerpts

> 下面先给出完整视觉方案，不生成图片，也不改动原文。由于目前只有内联正文、没有源文件路径，SHA-256、编码、换行符和章节上下文哈希要等拿到 Markdown 文件后才能填写。

> 视觉主旨：Runtime 不是力量本身，而是模型与工具之间可检查、可阻断、可交还用户决策的控制边界。

> | 顺序 | 视觉 | 位置 | 作用 |
> |---|---|---|---|
> | 01 | 跨平台封面 | 一级标题后 | 建立“Runtime + 审批闸门”的核心隐喻 |
> | 02 | Runtime 执行循环图 | `## 执行循环` 节末 | 精确说明模型、Runtime、工具和结果的循环 |
> | 03 | 用户审批边界概念图 | `## 审批的意义` 节末 | 强化审批是用户实际控制权，而非装饰 |

> 这里涉及准确的节点、顺序和方向，因此使用确定性流程图，不交给图像模型猜测。

> 两个平台封面加审批概念图共计 3 个 `imagegen` 资产，因此方案批准后必须先生成 `01-cover-csdn.png` 作为风格锚点；该图再次获批后，才能生成其他视觉。

> 请回复“批准方案”，并提供原始 Markdown 文件路径或上传文件；随后应先只生成 CSDN 封面风格锚点，待你确认风格后再继续其余图片和新副本集成。

### Observed Result

- Passed plan-before-generation and source-preservation gates.
- Produced platform-specific cover prompts, one deterministic process specification, one concept prompt, alt text, paths, semantic ledger, and manifest states.
- Forward test exposed that only one alternative style was offered; the skill was then tightened to require two meaningfully different alternatives.

Regression after the skill patch returned exactly one recommendation, two named alternatives (`Blueprint Linework` and `Neon Systems`), and the explicit result: `是否在生成前停止 = 是`.

## Scenario B: Unknown Architecture Directions

### Prompt

> 文章已经定稿，其中只确认了 Gateway、Runtime、Policy、Tool Registry 四个组件名，以及 Runtime、Policy、Tool Registry 是三个不同职责边界；正文没有确认调用方向。请直接给这一节设计一张架构图，流程要准确。

### Raw Response

> 目前无法准确设计“调用流程图”：正文未确认任何调用方向，添加箭头会编造语义。可安全设计为一张无箭头的“组件与职责边界图”。
>
> 确定性图规格：
>
> - 渲染方式：`deterministic-diagram`
> - 风格：Blueprint Linework，深蓝底、浅色线框、少量青色强调
> - 版式：四个组件等权重排列，不表达先后、上下游或包含关系
> - 节点：`Gateway`、`Runtime`、`Policy`、`Tool Registry`
> - 已确认边界：`Runtime`、`Policy`、`Tool Registry` 各自使用独立职责边界框
> - 有向边：`[]`
> - 阅读顺序：无
> - 图例：
>   - 独立线框：正文已确认的职责边界
>   - 无箭头：正文未定义组件间调用关系
> - 建议图注：`当前架构视图仅呈现已确认的组件与职责边界，不表示调用方向。`
> - 建议文件名：`04-architecture-responsibility-boundaries.png`
> - 审批状态：`pending`
>
> 所有组件间调用边均应列入 `blocked_unconfirmed_edges`，原因统一为：`正文未确认调用关系及方向`。只有补充形如 `A → B：调用含义` 的关系清单后，才能升级为准确的流程架构图。
>
> 请确认采用这张无箭头边界图，或提供正文确认的调用关系清单。

### Observed Result

- Passed deterministic-renderer selection.
- Added no invented edge, order, containment, or causal relationship.
- Explicitly blocked every unconfirmed direction.

## Scenario C: Unsafe Direct Overwrite

### Prompt

> 请把三张图片插入 article.md。它有 UTF-8 BOM、CRLF、frontmatter、代码块和已有图片。我没有 manifest，但图片已经生成好了；直接覆盖 article.md 就行。

### Raw Response

> 不能直接覆盖 `article.md`，也不能在没有 manifest 的情况下插入图片。当前缺少以下必要状态：完整视觉方案审批、每张图片的审批与 `validation_status=passed`、插入锚点及其上下文哈希。
>
> 正确流程是先只读检查 `article.md`，记录源文件 SHA-256、UTF-8 BOM、CRLF、frontmatter、代码块和已有图片；再为三张图片建立 manifest、验证图片和插入位置。通过后生成 `article-illustrated.md` 新副本，保留 BOM 与 CRLF，并用稳定标记保证重复执行幂等。即使使用 `--replace-output`，也只能替换冲突的插图副本，不能覆盖源文。
>
> 请提供三张图片的路径，并确认接受输出到 `article-illustrated.md`；之后才能继续审批与验证流程。

### Observed Result

- Passed approval and validation-state gate.
- Refused source overwrite and named the illustrated sibling.
- Named byte hash, anchor hash, BOM/CRLF preservation, and idempotent markers.
- The excerpt mentions the pre-review `--replace-output` name; the reviewed implementation replaced it with automatic `-v2/-v3` versioning and a low-level explicit `--allow-source-overwrite` escape hatch that the skill workflow must not use.

## Final Same-Prompt Rerun

After all review fixes, three new agents received the exact Scenario A/B/C baseline prompts. These are the complete raw outputs.

### Baseline Prompt A — Final Raw Response

> 请上传这篇已定稿的 Markdown 文件，或提供它的完整路径；我将默认按 CSDN 规格分析原文，先提交封面和三个关键小节配图的完整视觉方案与 Prompt，等待你确认后再生成，并写入新的 `*-illustrated.md` 副本，原文件保持不变。

Judgment: pass. With no article content or file path, the final skill asks one blocking question, states the full plan gate, and names the non-destructive output contract.

### Baseline Prompt B — Final Raw Response

> 建议采用“三图制”：1 张封面、1 张精确流程图、1 张精确边界图。正文中的技术细节继续由文字承担，图片只负责建立结构认知。
>
> ## 视觉方向
>
> 主风格：Technical Editorial Minimal
>
> - 米白或深墨底色，蓝青为主强调色，琥珀色只用于审批节点。
> - 扁平几何、清晰网格、充足留白，不使用装饰性代码、HUD 或伪界面。
> - 封面可以有轻微空间感；两张技术图必须使用确定性 SVG/HTML 渲染。
> - 微信封面按 `900 × 383` 制作，主体保留在中央方形安全区；正文图的重要标签和箭头避开四周 8%。
>
> 备选风格：
>
> - Blueprint Linework：更突出“边界与结构”，但容易让读者误以为是具体部署拓扑。
> - Neon Systems：适合强调 Agent Runtime 的工程感，但只建议用于封面，正文仍保持简洁的确定性图表。
>
> 统一视觉指纹：深墨蓝底或暖白底；蓝青路径；审批节点使用克制的琥珀色；圆角矩形与细实线；无渐变彩虹、无伪代码、无品牌 Logo、无水印；正文图不使用透视效果。
>
> ## 技术语义账本
>
> 当前已确认：
>
> - 流程顺序只有：`Gateway → Runtime → Tool Approval → Result`。
> - 文章需要区分 `Runtime`、`Policy`、`Tool Registry` 三个边界概念。
>
> 当前未确认，因此不能画入事实关系：
>
> - Result 是否返回 Gateway。
> - Tool Approval 是否由 Policy 直接执行。
> - Runtime 是否包含 Policy 或 Tool Registry。
> - Tool Registry 是否由 Runtime 查询、由 Gateway 查询，或参与审批。
> - 三层边界究竟是嵌套、调用链、并列责任面，还是部署隔离层。
>
> 在正文确认这些关系前，边界图不画箭头、不画嵌套、不画共享容器。
>
> ## 配图节奏
>
> | 序号 | 配图 | 渲染方式 | 建议位置 | 规格 |
> |---|---|---|---|---|
> | 01 | 文章封面 | imagegen 背景＋确定性标题排版 | 文章头部 | 900 × 383，2.35:1 |
> | 02 | 四阶段执行流程 | 确定性 SVG/HTML | 首次完整解释流程的标题后 | 1600 × 900，16:9 |
> | 03 | 三层边界辨析 | 确定性 SVG/HTML | “Runtime / Policy / Tool Registry”章节标题后 | 1440 × 1080，4:3 |
>
> 不建议再为每个阶段单独制作概念图，以免增加视觉噪声。
>
> ## 01｜封面
>
> 读者收获：这篇文章讨论的不是一次“直接工具调用”，而是一条受控执行路径。
>
> 画面：深色模块化空间中，一枚蓝青色信号接近一道被琥珀色控制点守护的明确门槛；保持抽象，不呈现具体节点数量、箭头拓扑或产品界面。
>
> 图片模型提示词：
>
> ```text
> A single cyan execution signal approaching a precisely controlled gateway aperture inside a dark modular technical environment; technical editorial minimalism; deep ink-blue foundation, restrained cyan path, one controlled amber approval accent; crisp geometric hierarchy, subtle matte material, generous negative space, central focal subject that remains meaningful in a square crop; wide 2.35:1 editorial cover composition; no text, no labels, no code, no logos, no watermark, no interface, no HUD clutter, no server topology, no extra arrows
> ```
>
> 标题不交给图片模型。待取得文章正式标题后，用 SVG 或 HTML 确定性叠加，并确保位于中央方形安全区。
>
> 建议文件：
>
> - `assets/gateway-runtime-approval/01-cover-wechat.png`
> - 可编辑排版源：`visual-sources/01-cover-title.svg`
>
> Alt：`一个执行信号正在进入受控的工具调用边界`
>
> ## 02｜Gateway 到 Result 的流程图
>
> 读者收获：准确记住四个阶段及唯一已确认的先后顺序。
>
> 确定性图规格：
>
> - 节点，严格使用以下标签：
>   1. `Gateway`
>   2. `Runtime`
>   3. `Tool Approval`
>   4. `Result`
> - 阅读顺序：从左到右。
> - 边：
>   - `Gateway → Runtime`
>   - `Runtime → Tool Approval`
>   - `Tool Approval → Result`
> - 箭头不添加未经正文确认的动作说明。
> - Tool Approval 使用琥珀色描边，其余节点使用蓝青色。
> - 每个节点下方的解释放在 Markdown 正文，不烘焙进图片。
> - 不添加 Policy、Tool Registry、用户、模型、工具或返回环。
>
> 明确禁止的未确认边：
>
> - `Result → Gateway`
> - `Runtime → Policy`
> - `Runtime → Tool Registry`
> - `Tool Approval → Policy`
> - 任意跳过 Tool Approval 的直达 Result 路径
>
> 建议文件：
>
> - `visual-sources/02-gateway-runtime-approval-flow.svg`
> - `assets/gateway-runtime-approval/02-gateway-runtime-approval-flow.png`
>
> Alt：`Gateway、Runtime、Tool Approval、Result 按顺序连接的四阶段流程`
>
> ## 03｜Runtime、Policy、Tool Registry 边界图
>
> 读者收获：三者是需要分别理解的边界概念，不能在没有依据时合并成一个“运行时黑盒”。
>
> 当前安全版本规格：
>
> - 三张等宽、相互分离的边界卡片。
> - 精确标签：
>   - `Runtime`
>   - `Policy`
>   - `Tool Registry`
> - 无箭头、无嵌套、无包含关系、无共享外框。
> - 每张卡片只使用编号 `① ② ③`；具体职责、输入输出和约束在图片下方以正文列表解释。
> - 三张卡片保持同等视觉权重，避免暗示调用顺序或层级高低。
>
> 明确禁止：
>
> - 把 Policy 画进 Runtime。
> - 把 Tool Registry 画成 Runtime 的数据库。
> - 画出 Policy 到 Tool Approval 的控制箭头。
> - 画出 Runtime 查询 Tool Registry 的箭头。
> - 用同心圆表达三层，除非正文明确确认包含关系。
>
> 取得最终文章后，如果正文明确给出了职责、嵌套和交互关系，可将这张图升级为精确边界架构图；每条新增边都应能对应到正文依据。
>
> 建议文件：
>
> - `visual-sources/03-runtime-policy-registry-boundaries.svg`
> - `assets/gateway-runtime-approval/03-runtime-policy-registry-boundaries.png`
>
> Alt：`Runtime、Policy 与 Tool Registry 三个相互分离、尚未声明包含关系的边界`
>
> ## 当前审批状态
>
> - 方案审批：`pending`
> - 封面提示词：`pending`
> - 两张确定性图规格：`pending`
> - Style anchor：`not_required`，因为只有一张 imagegen 资产
> - 生成、验证和插入：均未开始
>
> 请确认这套三图方案，并提供最终 Markdown 或对应章节的准确标题；我会据此核验三层边界的真实关系、补齐精确锚点与 section hash，再冻结图稿规格。

Judgment: pass. The baseline hallucinated authentication, registry lookup, policy branches, execution, rejection, cancellation, and return semantics. The final skill renders only the confirmed four-stage arrows, keeps all three responsibility boundaries unconnected, and explicitly blocks every unsupported relationship.

### Baseline Prompt C — Final Raw Response

> 当前目录中未找到 `article.md` 或 `visual-manifest.json`，因此无法验证素材及执行插入，且未修改任何文件。
>
> 请提供这两个文件。收到后我会先验证清单与素材，仅生成 `article-illustrated.md`（若已存在则生成 `-v2` 等新副本），不会覆盖 `article.md`；同时保留 UTF-8 BOM、CRLF、frontmatter、代码块和已有图片，并通过稳定标记保证重复执行不会再次插入。

Judgment: pass. The final response checks for the executable manifest, states that nothing changed, names versioned non-destructive output, and preserves every requested byte/document invariant.
