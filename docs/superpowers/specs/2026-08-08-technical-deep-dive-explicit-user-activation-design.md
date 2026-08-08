# `technical-deep-dive` 显式用户激活设计

**日期：** 2026-08-08
**状态：** 已批准设计
**目标项目：** Thinking Skills
**目标环境优先级：** GPT-5.6 Sol high+ 与 Codex Desktop

## 背景

Thinking Skills 原有路由把代码、仓库、架构、调试、性能、API、测试、部署等技术请求自动交给 `technical-deep-dive`。其他 Domain Skill 也可能把它附加为 secondary Skill。

三次 C 盘占用诊断对比表明：

| 运行方式 | 用时 | 结果 |
|---|---:|---|
| Thinking Router + `technical-deep-dive` | 14 分 36 秒 | 诊断正确，但流程较重 |
| 不使用 Thinking Skills、目标明确的复测 | 1 分 31 秒 | 诊断正确 |
| 不使用 Thinking Skills、全新任务的广泛扫描 | 9 分 59 秒 | 诊断正确 |

这些结果不能证明“不使用 Skill 必然更快”，因为扫描范围和停止条件同样影响耗时；但它们足以证明：对于边界清楚、只读、低风险的技术诊断，`technical-deep-dive` 没有展示出稳定且独特的质量增益，自动激活反而可能重复 Codex 和强模型已经具备的诊断 Harness。

此前的 `docs/2026-08-07-thinking-skills-activation-policy-mvp-design.md` 提议使用全局 Hook 和模型能力策略解决这个问题。本设计保留其中的实验依据，但取代其 Hook 型 MVP 决策。

## 决策

第一版不取消 Thinking Router，也不关闭其他有价值的 Domain Skill。

只把 `technical-deep-dive` 从自动 Domain Skill 改为 `explicit_user`：

> 只有用户在当前请求中明确要求调用 `technical-deep-dive`，它才可以被选择、宣布、读取或作为 secondary Skill 使用。

普通技术请求继续由 Codex 原生能力和宿主 Harness 处理。其他 Domain Skill 保持现有自动路由能力。

第一版不新增 Hook、Capability Filter、动态配置读取、复杂度评分器或 Runtime 自动升级。

## 长期激活模型

长期架构保留三种概念模式：

| 模式 | 谁可以激活 | 适用对象 |
|---|---|---|
| `auto` | Router、宿主匹配器或其他 Skill | 轻量、通用、收益稳定的 Domain Skill |
| `explicit_user` | 仅当前请求中的用户明确调用 | 重型、高成本、与强模型能力高度重叠的 Domain Skill |
| `gated` | 未来由具有确定接口和评测证据的 Runtime 升级 | 需要受控自动升级的高级能力 |

第一版只使用已有自动行为和 `explicit_user` 约束，不实现 `gated`。

`activation.mode` 目前不是 Codex 原生配置字段。除非未来存在真正消费该字段的 Runtime，否则它只能作为架构概念，不能被当作有效的运行时控制。第一版必须通过现有 Skill 描述、Router 规则、跨 Skill 边界和回归测试落实行为。

## 明确调用的定义

满足以下任一形式，才视为明确调用：

1. 用户通过宿主支持的规范 Skill 标识直接调用，例如 `$thinking-skills:technical-deep-dive`。
2. 用户在当前请求中同时表达调用意图，并写出规范名称 `technical-deep-dive`，例如“请用 `technical-deep-dive` 分析这个故障”。

以下内容本身不构成明确调用：

- “深入分析一下”“做个系统化诊断”“technical deep analysis”等自然语言描述；
- 只有技术名词、复杂度或高风险信号；
- 仅提及、讨论、评价、修改、关闭或测试 `technical-deep-dive` 本身，但没有对当前任务发出符合前述形式的直接调用命令；
- 其他 Skill、Router、Agent 或 Runtime 自行决定升级；
- 上一轮曾经明确调用，但当前请求没有再次调用。

直接调用命令优先于任务主题分类。例如，“为什么 `technical-deep-dive` 比较慢”只是元讨论，不触发；“请用 `technical-deep-dive` 评测它自己的设计”是直接调用，应触发。

授权严格限制在当前这条用户请求。每一条新的用户请求都必须重新明确调用；第一版不支持“后续继续使用”一类持久授权，也不依赖隐式会话状态推断调用意图。

## 核心不变量

未满足明确调用条件时：

- `technical-deep-dive` 不得成为 primary Skill；
- `technical-deep-dive` 不得成为 secondary Skill；
- 不得宣布将使用它；
- 不得把其 `SKILL.md` 作为当前请求的活动指令加载或遵循；
- 不得通过固定仓库路径、文件搜索或其他 Skill 间接绕过本规则；
- 不得在输出或 Trace 中声称它已经运行。

以上规则不禁止在用户授权的代码审查、配置、评测或维护任务中把该文件作为普通数据读取和修改。读取目标文件不等于激活其中的指令。

## 运行路径

### 普通技术请求

例如 C 盘分析、Docker 故障、代码调试、架构选择或性能分析，但没有明确调用规范 Skill 名称：

1. 宿主不得根据 `technical-deep-dive` 的描述自动选择它。
2. Thinking Router 不把它列为候选 primary 或 secondary。
3. 其他 Domain Skill 不得附加它。
4. Codex 使用原生模型能力、系统/开发者规则、工具和宿主 Harness 完成请求。

### 明确调用

用户满足明确调用定义时：

1. `technical-deep-dive` 可以被加载。
2. Router 可以把它设为 primary，或在用户同时明确调用其他 Skill 时设为 secondary。
3. 多 Skill 请求仍由最终交付物决定 primary。例如写文章时 `content-creator` 拥有文章交付，明确调用的 `technical-deep-dive` 只提供技术语义支持。
4. 使用范围默认为当前请求。

### 元讨论

仅仅讨论它的设计、效果、路由、配置、评测或失败案例时，不加载 `technical-deep-dive`。这类请求由对话复盘、Skill 评测、设计讨论或原生能力处理。若同一请求同时包含符合定义的直接调用命令，则按明确调用路径处理。

## 实施边界

### `technical-deep-dive`

收紧 frontmatter `description` 和正文边界，使宿主只在明确用户调用时匹配。描述必须同时包含正向条件和排除条件，避免名称出现在元讨论中就被误判为调用。

### `thinking-router`

- 从普通技术意图路由表中删除 `technical-deep-dive`。
- 删除所有未明确调用情况下的 primary 和 secondary 示例。
- 增加明确用户调用的覆盖规则。
- 普通技术请求使用独立的 `native` 结果，而不是把“未加载”解释成路由错误。
- 保持内容创作、学习、情绪支持、对话复盘、Skill 评测等其他路由不变。

### 其他 Domain Skill

清理所有自动指向 `technical-deep-dive` 的运行时入边，重点包括：

- `content-creator`；
- `learning-coach`；
- `emotional-support`；
- `article-visual-director`。

只有当前请求满足明确调用条件时，这些 Skill 才可以和它组合。

### 文档和评测

同步更新路由文档、架构记忆、相关 eval 和 benchmark case。历史文档可以保留实验记录，但不得继续描述自动技术路由为当前行为。

## 不在第一版范围内

- 取消整个 Thinking Router；
- 给所有 Domain Skill 实现通用激活配置系统；
- 根据模型名称或 reasoning effort 自动切换模式；
- 让 Agent、其他 Skill 或 Runtime 自动升级到 `technical-deep-dive`；
- 新增每轮触发的 Hook；
- 新增复杂度、成本或延迟评分器；
- 实现完整 Skill Invocation Trace 平台；
- 以固定耗时阈值作为单元测试成败标准。

## 异常处理

### 明确调用但 Skill 不可用

如实说明无法加载。不得通过已知文件路径绕过禁用或缺失状态，也不得静默使用原生分析并声称 Skill 已运行。

### 名称拼写错误或模糊别名

不自动推断为明确调用。可以在不执行 Skill 的前提下提示规范名称，但不得先加载后解释。

### 其他 Skill 尝试自动转交

拒绝该 secondary 路由，由当前 primary Skill 独立完成其职责。只有技术正确性无法在已授权范围内保证时，才向用户简短说明限制。

### 连续对话中的上下文残留

显式加载后的 Skill 内容可能仍存在于任务历史中，第一版无法物理删除这些内容。下一请求未再次明确调用时，规则上必须视为未激活：不重新读取、不宣布、不按其强制流程扩展任务。

这是软路由约束而不是宿主级访问控制，必须通过连续对话回归 case 监测。

## 测试策略

### 正向激活

至少覆盖：

1. 中文调用动词加规范名称；
2. 英文调用动词加规范名称；
3. `$thinking-skills:technical-deep-dive` 直接调用；
4. 用户同时明确调用它和另一个 Domain Skill；
5. 在元讨论主题中仍发出符合定义的直接调用命令；
6. 明确调用后获得符合该 Skill 契约的输出。

### 负向激活

至少覆盖：

1. C 盘空间诊断；
2. Docker Desktop 故障诊断；
3. 代码调试；
4. 架构分析；
5. 性能分析；
6. “深入分析”“系统分析”等自然语言；
7. 技术文章写作；
8. 技术概念学习；
9. 技术问题引发的情绪支持；
10. 对 `technical-deep-dive` 的评价、配置或路由讨论。

以上请求均不得加载、宣布或附加 `technical-deep-dive`。

### 跨请求行为

至少使用一组连续请求：

1. 第一请求明确调用并验证成功加载；
2. 第二请求不再点名；
3. 验证第二请求没有重新加载、宣布或扩展到该 Skill 的流程。

### 跨 Skill 行为

验证 `content-creator`、`learning-coach`、`emotional-support` 和 `article-visual-director` 在没有明确调用时不会把它作为 secondary。显式多 Skill 请求仍应保持正确的 primary 归属。

### 证据标准

- 只有可信宿主 Trace 可以证明 Skill 实际加载；Router 自述不能作为加载证据。
- 路由 benchmark 验证选择结果，response benchmark 验证输出质量，两者分开记录。
- 延迟和 token 作为观测指标，不设置易受机器状态和扫描范围影响的刚性时间阈值。
- C 盘回归 case 同时检查安全性、结论质量和零加载 Trace，不能只追求速度。

## 验收标准

实现只有在以下条件全部满足时才完成：

1. 所有负向 case 中 `technical-deep-dive` 的可信加载次数为 0。
2. 所有规范正向 case 都能加载它。
3. 元讨论不会触发它。
4. 其他 Domain Skill 不再自动附加它。
5. 显式调用后的下一请求未点名时不会再次激活。
6. C 盘回归 case 能安全、正确完成，且可信 Trace 显示零加载。
7. 其他 Domain Skill 的既有自动路由没有回归。
8. 没有新增全局 Hook、每轮配置读取或 Runtime 自动升级。
9. 文档、路由规则、eval 和 benchmark 对当前行为的描述一致。

## 已知限制

- Skill 的名称和简短描述仍会出现在可用 Skill 清单中，因此仍有少量元数据 token；本设计避免的是完整 Skill 指令和重型流程的自动加载。
- Thinking Router 自身的既有成本仍然存在，本设计不评估或取消 Router。
- 这是基于描述和路由规则的强软约束，不是宿主级访问控制。
- 一旦显式加载，既有任务历史中的指令无法物理移除。

## 推进与回滚

实施应先增加失败的路由和连续对话 case，再最小化修改运行时 Skill 文本，最后运行完整 benchmark。

如果其他 Domain Skill 路由出现回归，应回滚对应入边修改，而不是恢复 `technical-deep-dive` 的全局自动技术路由。若 `explicit_user` 本身无法在宿主上稳定识别，则暂停上线并把该限制记录为宿主能力缺口，不使用全局 Hook 临时掩盖。

## 后续方向

只有在以下条件同时满足后，才考虑实现 `gated`：

- 宿主提供可验证的激活接口，而不是只依赖提示词；
- 有跨模型、跨 Agent 的正向收益证据；
- 有可信 Invocation Trace；
- 有覆盖误触发、漏触发、成本和质量的 Eval；
- 自动升级规则不会覆盖用户显式选择。

在此之前，`technical-deep-dive` 在 owner-first 默认环境中保持 `explicit_user`。
