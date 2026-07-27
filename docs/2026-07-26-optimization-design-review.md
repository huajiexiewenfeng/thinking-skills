# Thinking Skills 分层优化方案 — 评审记录

> 评审对象：`2026-07-22-thinking-skills-optimization-design.md`
> 评审日期：2026-07-26
> 仓库状态：`D:\csdn\D1-D3\thinking-skills`，工作区有 32 个已修改文件 + 4 个未跟踪路径，均未提交
> 验证方式：直接读取代码与 case 文件，运行 `node --test scripts/run-benchmark.test.js`（24/24 通过）

## 0. 前置结论

**仓库实现已经领先于设计文档。** 变更集 A 的主体（`kind` 三分类、route 评分、防泄漏 prompt、trace 通道）已经写在工作区里，`scripts/run-benchmark.js` 相比 HEAD 增加 809 行。因此本评审分两部分：文档中已被代码解决的问题，和代码中新出现的问题。

方案的核心判断依然成立：`SKILL.md` 文本无法强制其他框架的行为，仲裁必须由运行时执行；先修评测再改 Skill 行为的顺序正确；第一版拒绝连续权重是正确的克制。推荐路径 B、只授权变更集 A 的结论予以支持。

## 1. 已被代码解决的问题

### 1.1 Prompt 泄漏（文档 §7.1、§7.3）

设计文档 §7.3 的 route case 样例包含 `context` 字段，内容为 "The conversation is an exploratory architecture discussion. The user did not request implementation or a formal specification."。这两句话直接以自然语言陈述了 `objective=explore` 与 `mutation=none`，等于把 `expected_route` 从 prompt 里删掉之后又塞了回去。

实际代码没有采纳这个字段。`benchmarks/routing/technical-exploration-protocol.json` 使用 `turns`，只包含用户原话；`buildAgentPrompt`（`scripts/run-benchmark.js:549`）仅拼接指令与对话，不注入任何期望值。`run-benchmark.test.js:143` 与 `:166` 提供了两个专门的防泄漏断言。

**结论：代码正确，文档样例需要删除 `context` 字段，否则会误导后续 case 作者。**

## 2. 严重问题

### 2.1 `kind` 默认值静默吞掉 16 个 case 的路由断言

`scripts/run-benchmark.js:37-39`：

```js
function getCaseKind(item) {
  return item.kind || "response";
}
```

`validateCase` 只在 `kind` 为 `route` 或 `integration` 时调用 `validateRouteFields`，路由评分同样只走这两类。结果是所有未声明 `kind` 的旧 case 被静默归类为 `response`，其 `expected_route` 字段既不校验也不评分。

实测结果：

```
kind counts: { response: 17, route: 2 }
带 expected_route 但永远不会被评分的 case: 16
```

受影响的 case 包括 `router-learning-vs-technical-001`——一个 id 里带 `router`、专门用于测试路由的 case，它的期望路由从头到尾没有参与过打分。

**当前路由准确率的真实样本量是 2 个 case。** 变更集 A 的完成标准"错误路由能够稳定失败"在这个基础上不成立。

建议修复，二选一：

- 将 `kind` 改为必填字段，缺失即在 loader 抛错，强制 16 个旧 case 显式归类；
- 或保留默认值，但在 `validateCase` 中增加一条：若 `kind` 解析为 `response` 而 case 含有 `expected_route`，直接抛错。

倾向第一种。评测框架里的静默兜底是最危险的设计——它让失败表现为"分数正常"，而不是"报错"。

### 2.2 旧 case 仍在对用户可见回答做 Skill 名匹配

`benchmarks/routing/learning-vs-technical.json`：

```json
"expected": ["learning-coach"],
"must_not": ["technical-deep-dive as primary"]
```

`benchmarks/spontaneity/domain-still-routes-001.json`：

```json
"expected": ["content-creator", "article angle"],
"must_not": ["no-skill as primary", "route to no-skill"]
```

这正是设计文档 §7.1 判定为必须消除的反模式：要求自然回答中出现 Skill 名称，与"正常使用时隐藏路由痕迹"的原则冲突。

更进一步，`"route to no-skill"` 和 `"no-skill as primary"` 这类断言是评测者视角的短语，几乎不可能在真实回答中逐字出现，因此 `must_not` 永远为真，属于无成本的免费得分。它们让总分虚高，同时不提供任何鉴别力。

修复 2.1 时应一并把这些 case 拆成 route 断言（进 `expected_route`）与 response 断言（换成结构性检查），而不是继续做字符串包含。

## 3. 中等问题

### 3.1 缺少采样机制

`scripts/run-benchmark.js` 没有 `--n`、repeat、seed 或多数表决相关的任何实现（CLI 帮助文本中仅有 `--candidate-model` 与 `--harness-version`）。当前为单次采样打分。

在单次采样下，模型随机性足以吞掉 2 到 20 个 case 规模上的全部信号，"错误路由能够稳定失败"无法验证，变更集 B 之后也无法区分"改好了"与"抖动"。

建议在变更集 A 收尾前加入 `--samples N`（N≥3）与多数表决，并把每个 case 的采样一致性作为独立输出项——一致性低本身就是 case 定义不清的证据。

### 3.2 Schema 已漂移出设计文档

代码 `REQUIRED_PROFILE_FIELDS`（`run-benchmark.js:11-17`）要求 5 个字段：

```
domain, objective, mutation, artifact, artifact_sink
```

并额外引入了 `expected_advisory` 与 `must_not_select`。设计文档 §8.1 的字段表只有 `domain / objective / mutation / confidence`，§7.5 的四个 case 验收标准也基于旧 schema。

文档需要同步，否则它作为评审依据的效力已经失效。

### 3.3 首对 case 就与文档自相矛盾，且字段冗余

文档 §7.5 规定第三个 case 为 `objective=deliver`、`mutation=requested`。实际文件 `benchmarks/routing/technical-formal-spec-protocol.json` 写的是：

```json
"objective": "decide",
"mutation": "requested",
"artifact": "spec",
"artifact_sink": "workspace"
```

该 case 的 prompt 明确要求 "turn it into a formal, implementation-ready specification in the repository before development"，即要求在仓库中产出文件。标注为 `decide` 与文档定义不符。

这不是笔误，而是暴露了 `explore / decide / deliver` 三者缺少可操作判定规则。在仅有的两个 route case 上就已经出现分歧，意味着扩充 case 库之前必须先补规则，否则标注者之间无法达成一致，准确率数字失去意义。

同时注意：在现有两个 case 中，`mutation=requested` 与 `artifact_sink=workspace` 完全同步，`mutation=none` 与 `artifact_sink=chat` 完全同步。两个字段承载同一个信号。需要给出合法组合白名单，说明二者何时会分离；若不能给出，应合并其中一个。

### 3.4 `countQuestions` 的计数口径过于朴素

`scripts/run-benchmark.js:126`：

```js
function countQuestions(text) {
  return (text.match(/[?？]/g) || []).length;
}
```

半角与全角问号均已覆盖，这一点是对的。但该实现会把引用示例中的问号、反问句、以及回答里罗列的"待确认项"全部计入，而不带问号的提问（"我想确认一下你的部署环境"）则完全逃逸。

`asks_at_most_questions: 1` 是旗舰 explore case `technical-exploratory-protocol-feasibility-001` 的核心验收条件，其口径不应如此脆弱。建议至少排除代码块与引号内内容，或改为语义计数并进入人工 rubric。

### 3.5 负向断言仍以英文字面量为主

`benchmarks/technical-deep-dive/exploratory-protocol-feasibility.json` 的 `must_not` 为 `"Before I can answer"` 与 `"I need you to approve the design first"`。中文输出场景下这两条恒真；同时，一个好回答完全可能写出"这不是需要你先批准的设计"从而被误判。

建议把断言从词法改为结构：首 N 个 token 内是否出现结论性判断、是否存在"待用户回答后再继续"的终止态。词法检查只保留极少数确定性的。

## 4. 工程卫生问题

### 4.1 行尾符噪音污染 diff

多个文档的 diff 为纯 CRLF→LF 全行重写，改动内容为零：

```
docs/roadmap.md      206 +/-  206 -
docs/platforms.md    147 +/-  147 -
docs/skill-design-principles.md   394 行
docs/eval-runbook.md              576 行
```

`file docs/roadmap.md` 确认原文件为 CRLF。这部分噪音使整个变更集无法逐行评审。

建议：添加 `.gitattributes` 固定行尾策略，并把行尾规范化作为独立 commit 提交，与变更集 A 分离。

### 4.2 变更集 A 未被隔离

当前工作区混合了 32 个已修改文件，其中包含 `skills/content-creator/SKILL.md`、`skills/conversation-review/SKILL.md`、`skills/emotional-support/references/default-response.md`、`feedback/` 等与评测基础设施无关的改动。

设计文档 §11 要求每个变更集具备独立证据与回滚点。当前状态下变更集 A 无法单独回滚，也无法单独归因。

建议在提交前按主题拆分：行尾规范化、评测框架、Skill 内容改动，三者分开。

## 5. 设计层面的遗留意见

以下几条在代码中尚无对应实现，来自对文档本身的评审，仍然有效。

**`confidence: low` 没有定义行为。** 三层架构未规定低置信度时 Domain Skill 使用哪种模式、Process Skill 是否放行。这是最容易出问题的路径，却是唯一没有规则的路径。

**registry 中 `brainstorming` 的前置条件写反了。** 文档 §10.2 写 `preconditions: objective: [deliver]`，即探索阶段不加载 brainstorming。但头脑风暴恰恰最适用于探索期。原始 case 的问题不是"探索期不该有 brainstorming"，而是"brainstorming 的硬门禁不该阻塞首轮实质回答"。前置条件应挂在 `mutation` 或产物创建动作上，而不是排除整个 Skill。这一处错误说明 §2 的问题归因还差一步。

**变更集 C 的适配器必须在文档中写死。** 完成标准要求"元数据改变可观察的 Skill 加载行为"，而据 §4.1，Cursor 与 OpenCode 适配器只注入路由文本，物理上无法验证该标准。PoC 必须选择 Claude 或 Codex 这类真正控制 Skill 发现与加载的适配器。

**registry 的所有权问题（决策点 4）需要给出答案。** 建议：canonical registry 只做索引与合并，每个 Skill 的协议元数据由其所有者自声明。由 Thinking Skills 仓库替 Superpowers 维护条目必然漂移。这同时意味着协议长期应独立为 Runtime Protocol 项目，但拆分时机应在变更集 C 的 PoC 跑通、且出现第二个消费者之后。

**§12.2 的十个指标需要分主次。** 变更集 A 阶段建议：主指标为路由与 Task Profile 准确率；护栏指标为正式交付任务的门禁保持率（不得下降）；其余降级为观察项。十个并列指标等于没有发布标准。

**缺少回滚条件。** 每个变更集写了完成标准，但没有写在什么情况下撤回。变更集 B 至少需要一条：交付门禁保持率下降超过阈值即回滚，无论探索体验改善多少。

## 6. 对四个决策点的回答

**决策点 1（先修 benchmark 再改 Skill 行为）**：同意。但必须把"修好"的定义从"加了 route kind"提升到"路由断言真正参与评分 + 有采样"。当前状态下，评测基础的可信度尚未达到可以支撑变更集 B 的程度。

**决策点 2（`objective + mutation` 而非 `interaction_mode + process_gate_allowed`）**：方向正确。但需补合法组合白名单与 explore/decide 判定规则，并说明 `mutation` 与 `artifact_sink` 何时分离。

**决策点 3（第一版只用离散状态）**：同意。`lead | support | critic | inactive` 已经够用，不需要连续比例。

**决策点 4（协议归属）**：短期留在 Thinking Skills 仓库，但元数据由 Skill 所有者自声明，registry 只做索引。等 PoC 跑通且出现第二个消费者后再拆为独立项目。

## 7. 建议的下一步顺序

1. 拆分工作区：行尾规范化、评测框架、Skill 内容改动三个独立 commit。
2. 修复 `kind` 默认值问题，让 16 个旧 case 显式归类，得到第一个真实的路由准确率基线。
3. 清理旧 case 中的 Skill 名字符串断言与恒真 `must_not`。
4. 补写 `explore / decide / deliver` 判定规则，重新标注 `technical-formal-spec-protocol.json`。
5. 加入 `--samples N` 与多数表决，重跑基线。
6. 同步设计文档（删除 §7.3 的 `context`、更新 §8.1 字段表与 §7.5 验收标准）。
7. 以上全部完成后，再考虑修改 `technical-deep-dive/SKILL.md`。

在第 5 步产出可信基线之前，不建议进入变更集 B。
