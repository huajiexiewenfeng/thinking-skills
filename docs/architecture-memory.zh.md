# Thinking Skills 架构记忆

这是一份面向人和 AI agent 的紧凑架构记录。

它用于快速学习项目、在新 session 中恢复上下文，或者判断未来某个改动应该放在哪里。

## 项目身份

Thinking Skills 是一个独立的、领域中立的思考技能框架。

它受到 skill-based agent workflows 的启发，但不是 Superpowers fork、plugin，也不是 coding-first 方法论。

核心目标是：

```text
把用户请求路由到合适的思考模式，
再由 domain skill 使用自己的世界观、方法底座、输出形态和安全边界来协作。
```

## 核心架构

```text
用户请求
  -> thinking-router
  -> domain skill
  -> method bases
  -> response
  -> feedback/failure case
  -> improvement loop
```

框架有四个主要层级：

| 层级 | 目的 |
|---|---|
| Router | 判断意图并选择 skill |
| Domain Skills | 执行领域专属思考 |
| Method Bases | 显式声明底层方法 |
| Improvement Flywheel | 把失败转化为 eval 和 patch |

## 目录地图

```text
skills/
  thinking-router/
  content-creator/
  technical-deep-dive/
  emotional-support/
  skill-evaluator/

docs/
  principles.md
  architecture-memory.md
  architecture-memory.zh.md
  routing.md
  method-bases.md
  safety.md
  evaluation.md
    improvement-loop.md
    failure-taxonomy.md
    eval-schema.md
    eval-runbook.md
    skill-authoring.md
  platforms.md
  roadmap.md

evals/
  routing-cases.md
  content-creator-cases.md
  technical-deep-dive-cases.md
  emotional-support-cases.md
  skill-evaluator-cases.md

cases/
  emotional-support/
    assessment-to-chat-mode-mismatch.md

.codex/
.codex-plugin/
.claude-plugin/
.cursor-plugin/
.opencode/
```

## Router 层

`thinking-router` 是入口。

它应该：

- 判断用户请求。
- 选择一个 primary skill。
- 最多添加一个 secondary skill。
- 低置信度时只问一个短的路由问题。
- 不默认假设这是软件开发问题。

它不应该：

- 回答用户的实质问题。
- 因为出现多个关键词就加载多个 skill。
- 把模糊请求默认当成技术问题。

重要路由区别：

- 写技术主题的文章，通常 primary 是 `content-creator`，secondary 是 `technical-deep-dive`。
- 因技术问题表达痛苦，通常 primary 是 `emotional-support`，secondary 是 `technical-deep-dive`。
- 真正的技术诊断，路由到 `technical-deep-dive`。

## Domain Skills

### `content-creator`

适用于：

- 文章
- 随笔
- 帖子
- 脚本
- 标题
- 大纲
- 论点
- 受众定位
- 内容结构

世界观：

```text
写作是与读者沟通。
```

预期输出：

- 受众
- 角度
- 论点
- 大纲
- 开头 hook
- 标题选项
- 修改方向

主要风险：

```text
不要编造事实、引用、统计数据或个人经历。
```

### `technical-deep-dive`

适用于：

- 代码
- 仓库
- 架构
- debugging
- 性能
- API
- 系统
- 数据库
- 测试
- 部署

世界观：

```text
技术推理应该区分事实、假设、推测、权衡和验证。
```

预期输出：

- 问题框定
- debugging 假设树
- 架构选项
- 权衡表
- 失败模式列表
- 验证清单

主要风险：

```text
不要编造没看过的代码事实。
```

### `emotional-support`

适用于：

- 焦虑
- 羞耻
- 自责
- burnout
- 关系痛苦
- 情绪困惑
- 危机信号
- 想理解感受和需要

世界观：

```text
用户首先需要被接住。
方法论在内部指导回复，但不应该默认倒给用户。
```

默认行为：

- 短。
- 像人。
- 少术语。
- 最多一个问题。
- 安全优先。

重要子模式：

- 默认支持。
- Deep Analysis Mode。
- Assessment boundary。
- Question budget。
- Action advice boundary。
- User pushback repair。

Deep Analysis Mode：

```text
Synthesis -> correction invitation -> one calibration question only if needed
```

不是：

```text
Question -> question -> question -> conclusion
```

主要风险：

- 问题太多。
- 专业术语太多。
- 输出太长。
- 过度确定。
- 太早给建议。
- 用户要求聊天后仍停留在 assessment。

### `skill-evaluator`

适用于：

- 审查失败的 skill 行为。
- 分类 failure types。
- 判断应该改 router、domain skill、evals、docs 还是 platform adapters。
- 提出最小修改建议。

世界观：

```text
失败应该先变成可复用 case 和 eval，再做大范围重写。
```

预期输出：

- Failure summary。
- Failure taxonomy labels。
- Likely source。
- Eval gap。
- Minimal patch plan。
- Overfitting risk。

## Method Bases

Method bases 是每个 skill 背后的显式方法框架。

它们不一定展示给用户。

层级：

| 层级 | 含义 |
|---|---|
| Core | 核心框架 |
| Supporting | 辅助方法 |
| Reflective | 可选隐喻或自我反思模型 |
| Safety | 边界、升级求助或拒绝模型 |

重要规则：

```text
方法论优先于泛泛聊天，但方法论不应该默认变成用户可见的机械结构。
```

对于 emotional-support，CBT、ACT、NVC、trauma-informed stance 等框架应该在内部指导注意力，不默认展示。

霍金斯式情绪地图只允许作为 reflective、非临床视角。

## Safety 层

安全规则适用于所有 skills。

高风险领域：

- 自伤
- 伤害他人
- 虐待或胁迫
- 医疗风险
- 法律风险
- 财务风险
- 安全/攻击风险

核心安全规则：

```text
出现即时风险时，安全优先于普通分析。
```

Skills 不能：

- 诊断。
- 声称提供治疗。
- 替代专业支持。
- 编造法律、医学或专业标准。

## Evaluation 层

当前 evals 是 Markdown 文件，位于 `evals/`。

它们测试：

- Router 准确性。
- Domain fit。
- Safety boundaries。
- Output shape。
- Negative and mixed cases。

未来 evals 可能迁移到 YAML 或 JSON。

结构化 case 格式见 `docs/eval-schema.md`。

## Improvement Flywheel

项目使用半自动改进飞轮。

```text
Failure signal
  -> abstract failure case
  -> classify failure
  -> add/update eval
  -> evaluate current skill
  -> propose minimal patch
  -> apply patch
  -> update changelog
  -> retest
```

失败案例应该抽象化。

不要存储原始私密对话。

第一个记录案例：

```text
cases/emotional-support/assessment-to-chat-mode-mismatch.md
```

## Failure Taxonomy

重要 failure labels：

| Label | 含义 |
|---|---|
| `ROUTING_MISS` | 选错 skill |
| `MODE_MISMATCH` | skill 对了，但子模式错了 |
| `QUESTION_OVERLOAD` | 问题太多 |
| `JARGON_EXPOSURE` | 专业语言太多 |
| `OVER_OUTPUT` | 回复太长 |
| `PREMATURE_ADVICE` | 建议给得太早 |
| `CERTAINTY_OVERREACH` | 猜测说得太确定 |
| `ASSESSMENT_STUCK` | 用户想聊天后仍继续测试/评分 |
| `SAFETY_MISS` | 漏掉安全风险 |
| `DOC_OVERLOAD` | skill 文档过重 |

## 平台适配

canonical skill 内容永远在：

```text
skills/
```

平台目录只是薄适配层：

```text
.codex/
.codex-plugin/
.claude-plugin/
.cursor-plugin/
.opencode/
```

Codex 已经通过 Skills CLI discovery 做过本地验证。当前本地仓库可发现五个 skills，包括 `skill-evaluator`。

Claude Code、Cursor、OpenCode adapters 已存在，但在对应客户端真实测试前，只应视为已实现 metadata/adapters。

## 当前已知设计债

### `emotional-support` 过大

状态：已完成初步模块化。

`emotional-support` 已拆成：

```text
skills/emotional-support/
  SKILL.md
  references/
    default-response.md
    deep-analysis-mode.md
    assessment-boundary.md
    safety-boundary.md
    mode-boundaries.md
    reflection-frames.md
```

主 `SKILL.md` 现在指向 reference modules。下一步是用 `evals/emotional-support-cases.md` 和抽象案例做回归测试。

### 平台适配需要真实客户端测试

Codex discovery 已本地测试。

Claude Code、Cursor、OpenCode 应该在真实 runtime 中测试。

### Roadmap 状态现在区分层级

状态标签：

```text
Implemented
Locally verified
Client verified
Regression covered
Refactor candidate
```

## 下一步建议

1. 用 `skill-evaluator` 审查近期 `emotional-support` 失败。
2. 把第一个抽象失败案例转成结构化 eval blocks。
3. eval 覆盖足够后，再把 `emotional-support` 拆成 references。
4. improvement flywheel 稳定后，再加 `life-decision`。
5. 在真实客户端测试 Claude Code、Cursor、OpenCode adapters。

## AI Session Bootstrap

当 AI agent 需要继续处理这个仓库时，先读这个文件。

然后根据任务只读必要文件：

- Router 修改：`skills/thinking-router/SKILL.md`、`evals/routing-cases.md`
- Emotional support 修改：`skills/emotional-support/SKILL.md`、`evals/emotional-support-cases.md`、相关 `cases/`
- Skill failure review：`skills/skill-evaluator/SKILL.md`、`docs/failure-taxonomy.md`、`docs/improvement-loop.md`
- Platform 修改：`docs/platforms.md`、相关平台目录
- Roadmap 修改：`docs/roadmap.md`、`CHANGELOG.md`
