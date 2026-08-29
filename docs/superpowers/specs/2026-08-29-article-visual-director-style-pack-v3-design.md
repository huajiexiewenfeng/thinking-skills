# Article Visual Director：Style Pack v3 防漂移设计

日期：2026-08-29

状态：对话设计已确认，等待书面规格复核

目标 Skill：`skills/article-visual-director`
前置设计：`docs/superpowers/specs/2026-08-28-article-visual-director-style-protocols-design.md`

## 1. 决策摘要

本设计在现有八种视觉模式、三张黄金图、Manifest v2、文章级风格锚点和非破坏性 Markdown 集成之上，引入 Style Pack v3。目标不是增加更多风格词，而是把每种模式变成可编译、可校验、可回归的生图协议，降低同一模式跨文章、跨会话和跨资产类型时的视觉漂移。

已确认的关键决策：

1. 保留现有八种模式的名称、序号、`profile_id` 和选择门。
2. 采用分层稳定策略：技术图严格锁定；封面和概念图保持同一视觉家族但允许内容驱动的构图变化。
3. 核心协议保持模型无关，并提供 GPT Image 专用适配层。
4. Style 8 的三张已批准黄金图作为首个完整迁移样本，保留现有图片、哈希和用户批准。
5. 参考 `awesome-gpt-image-2` 的 Prompt-as-Code、模板选择和防坑组织方法，但不复制第三方案例图片、品牌内容或完整提示词。
6. 新规则增强 `article-visual-director` 当前第 4–7 步，不替换路由、审批、语义安全和文章集成流程。
7. 自动视觉评分只预留接口，第一阶段不取代人工黄金图批准。

## 2. 问题定义

现有实现已经具备模式协议、设计 token、黄金图、文章锚点和发布验证，但仍存在四个执行缺口：

- 模式规则主要由自然语言描述，模型可以在每次任务中重新解释。
- 黄金图只被声明为参考角色，没有机器可检查的“必须继承、允许变化、禁止复制”矩阵。
- 当前风格校验器主要检查身份、文件、哈希和批准状态，不检查提示词结构、资产角色或视觉漂移规则。
- 没有跨主题压力测试证明一个模式在更换主题、隐喻和拓扑后仍能维持同一视觉家族。

因此，单纯给模式 1–7 各生成三张黄金图不足以解决问题。黄金图必须与结构化协议、提示词编译、生成前 lint、生成后验证和回归测试共同工作。

## 3. 目标与非目标

### 3.1 目标

- 同一模式更换文章后仍能被稳定识别为同一视觉家族。
- 封面、概念图和技术图使用不同的稳定度，而不是共用一套固定构图。
- 每次生成使用的视觉规则、参考图、适配器和完整提示词均可追溯。
- 黄金图只提供视觉语法，绝不提供文章事实、节点、数字或拓扑。
- 漂移失败能定位到具体字段，避免整段提示词重新抽卡。
- 模式在完成三张黄金图、压力测试、相邻模式区分和用户批准前保持 `candidate`。

### 3.2 非目标

- 不新增第九种模式，不重命名或重排现有模式。
- 不把所有模式变成相同布局的模板换皮。
- 不让页面 Green、Dark 等发布主题覆盖图片模式的核心调色板和视觉语言。
- 不使用第三方仓库图片作为本项目的永久黄金资产。
- 不要求普通单元测试调用在线生图服务。
- 不修改现有安全路径、源文件保护、BOM、换行符和幂等集成规则。

## 4. 与当前 Skill 的结合方式

当前工作流整体保留，仅在模式加载、提示词生产和视觉验证之间增加结构化执行层：

```text
inspect article
  -> present the existing eight bilingual modes
  -> wait for explicit style selection
  -> load selected approved Style Pack
  -> separate publication theme, visual profile, and asset semantics
  -> choose asset roles and visual rhythm
  -> propose complete visual plan
  -> wait for plan approval
  -> compile Prompt IR through the selected model adapter
  -> run preflight lint
  -> generate and approve the article anchor when required
  -> render remaining assets
  -> validate semantics, style drift, and series continuity
  -> create a new illustrated Markdown copy
```

现有职责映射如下：

| 当前机制 | Style Pack v3 增强 |
|---|---|
| semantic ledger / `asset_semantics` | 继续作为图片内容的唯一事实来源 |
| 独立模式协议 | 增加机器可读 Visual DNA 和角色契约 |
| token JSON | 继续服务确定性渲染 |
| 三张黄金图 | 增加继承矩阵和资格测试 |
| Manifest v2 | 增加 Style Pack、Prompt IR 和适配器追踪字段 |
| 文章风格锚点 | 继续保证当前文章内部的系列一致性 |
| `validate_style_contract.py` | 扩展为 schema、引用、编译和发布资格验证 |
| `apply_visual_plan.py` | 保持集成职责，不编译或猜测视觉状态 |

## 5. Style Pack v3 结构

每种模式的结构化文件位于自己的黄金锚点目录：

```text
assets/style-anchors/<profile_id>/
├── golden-set.json
├── visual-dna.json
├── role-contracts.json
├── reference-matrix.json
├── golden-cover.png
├── golden-concept.png
├── golden-diagram.png
└── corresponding prompt or editable source files
```

共享规范与适配器位于：

```text
references/
├── style-pack-schema.md
├── prompt-ir-schema.md
└── adapters/
    └── gpt-image.md
```

### 5.1 `visual-dna.json`

记录同一模式跨文章、跨角色不变的视觉基因：

- `surface`：背景、纸张、画布和表面行为；
- `palette_roles`：颜色及语义职责，而不是自由颜色列表；
- `line_language`：线宽、规则度、边缘和笔触；
- `material_and_texture`：材质、纹理和颗粒；
- `geometry`：节点、圆角、边界和图标形状；
- `depth_and_camera`：平面、正交、等距或电影透视；
- `typography`：标题、标签和说明的视觉语言；
- `density_and_spacing`：信息密度、留白和布局节奏；
- `required_traits`：必须可观察到的模式特征；
- `forbidden_traits`：出现即构成身份漂移的特征；
- `neighbor_boundaries`：与最相近模式的可观察区分。

### 5.2 `role-contracts.json`

为三种正式黄金角色定义不同稳定度：

| 角色 | 必须稳定 | 允许变化 |
|---|---|---|
| `cover` | Visual DNA、主体层级、占画率、裁切存活 | 主体、隐喻、左右或中心构图 |
| `concept` | Visual DNA、叙事密度、颜色语义、标注语言 | 隐喻、场景、阅读路径 |
| `diagram` | Visual DNA、网格、节点几何、边界、箭头、图例 | 仅按冻结语义图改变节点和拓扑 |

技术图优先使用确定性渲染。若某模式的 diagram 黄金锚点由 imagegen 产生，它仍只提供表面视觉语法，生产图的技术关系必须来自冻结语义图。

### 5.3 `reference-matrix.json`

每个黄金资产记录：

```json
{
  "golden_asset_id": "profile-role-v1",
  "must_preserve": [],
  "may_vary": [],
  "must_not_copy": [
    "labels",
    "numbers",
    "nodes",
    "topology",
    "example_story"
  ]
}
```

列表项必须是可观察、可验证的属性。`beautiful`、`professional` 等泛化形容词不能作为唯一约束。

### 5.4 `golden-set.json`

保留现有身份、协议版本、三类资产、文件哈希、提示词或可编辑源文件、参考角色和用户批准字段，并增加：

- `style_pack_version`；
- `visual_dna_sha256`；
- `role_contracts_sha256`；
- `reference_matrix_sha256`；
- `qualification.prompt_compile_status`；
- `qualification.cross_topic_probe_status`；
- `qualification.neighbor_discrimination_status`；
- 每张资产的独立批准与修订记录。

## 6. Prompt IR 与模型适配器

### 6.1 编译输入

```text
article semantics
  + selected profile
  + asset role
  + Visual DNA
  + role contract
  + same-role golden reference matrix
  + approved article anchor when required
  + platform profile
```

默认只引用同角色永久黄金图。文章锚点批准后再加入文章锚点。跨角色黄金图不默认加入；确有属性缺口时必须在 Manifest 中记录原因。

### 6.2 Prompt IR

模型无关的中间结构至少包含：

- `profile_id`、`style_pack_version` 和 `asset_role`；
- `objective`；
- `semantics.confirmed`、`simplifications` 和 `blocked`；
- `composition`；
- `visual_dna`；
- `reference_contract.required_references`；
- `must_preserve`、`may_vary` 和 `must_not_copy`；
- `text_policy`；
- `platform`；
- `negative_constraints`；
- `acceptance_checks`。

Prompt IR 是最终提示词的事实来源。适配器只能重排和表达这些字段，不能补充文章事实或隐式改变模式。

### 6.3 GPT Image 适配器

GPT Image 适配器固定编译八个区块：

1. `OUTPUT CONTRACT`
2. `ARTICLE SEMANTICS`
3. `ROLE COMPOSITION`
4. `VISUAL DNA`
5. `REFERENCE CONTRACT`
6. `TEXT POLICY`
7. `NEGATIVE CONSTRAINTS`
8. `ACCEPTANCE CHECK`

适配器吸收 `awesome-gpt-image-2` 中“输出类型、构图布局、风格材质、文字、比例、限制和负面项”的结构化组织方法，同时保留本项目更严格的语义图、黄金引用和用户批准边界。

## 7. 生成前 lint

`compile_image_prompt.py` 在输出最终提示词前失败关闭。以下情况禁止调用图片模型：

- 八个提示词区块不完整；
- profile、role、token 或黄金图身份不一致；
- 缺少同角色黄金图或继承矩阵；
- `must_preserve` 只有泛化形容词，缺少可观察条件；
- `must_not_copy` 未覆盖黄金图文字、数字、节点和拓扑；
- 技术图缺少已验证的冻结语义图；
- 精确标题或密集技术标签错误地交给图片模型；
- publication theme 越权修改 Visual DNA；
- 平台比例、占画率或裁切安全区缺失；
- 未经声明混入其他模式或跨角色参考图。

失败时返回结构化错误，不退回自由提示词。

## 8. 生成后验证与错误代码

验证分为四层：

| 层级 | 检查 | 失败处理 |
|---|---|---|
| 文件 | 文件、尺寸、比例、哈希 | 拒绝资产 |
| 语义 | 主体、节点、箭头、数字、因果和边界 | 修正语义规格 |
| 风格 | 色彩职责、线条、材质、几何、密度和角色布局 | 只修正对应 Style Pack 字段 |
| 系列 | 黄金图、文章锚点和同篇前序图片的连续性 | 定向修正漂移属性 |

统一错误代码：

- `PROMPT_BLOCK_MISSING`
- `STYLE_IDENTITY_DRIFT`
- `ROLE_LAYOUT_DRIFT`
- `PUBLICATION_THEME_BLEED`
- `GOLDEN_CONTENT_COPY`
- `SEMANTIC_TOPOLOGY_DRIFT`
- `SERIES_CONTINUITY_DRIFT`
- `TEXT_POLICY_VIOLATION`

失败后不得整段自由重写提示词。系统应把失败映射到具体字段，例如颜色漂移修正 `palette_roles`，构图过密修正角色 spacing，人物误入修正 `forbidden_subjects`，技术箭头错误修正 semantic graph。

## 9. 黄金图生产与资格晋级

### 9.1 Style 8 迁移

Style 8 保留现有三张黄金图、文件哈希、提示词和用户批准。迁移过程只增加结构化元数据和资格验证：

```text
existing approved assets
  -> extract Visual DNA
  -> define role contracts
  -> define reference matrix
  -> compile equivalent GPT Image prompts
  -> run cross-topic probes
  -> activate style_pack_version 3
```

迁移不重新解释黄金图内容，也不因增加结构化字段自动撤销用户审美批准。若实际图片或核心视觉规则发生变化，才需要重新批准。

### 9.2 模式 1–7 生产

每个模式依次完成：

```text
mode boundary
  -> candidate Visual DNA
  -> cover candidate and approval
  -> concept candidate and approval
  -> diagram candidate and approval
  -> cross-topic probes
  -> neighbor discrimination
  -> final user approval
  -> approved
```

在模式没有同角色黄金图的 bootstrap 阶段，允许使用上一张已批准候选作为临时参考，但必须标记：

```json
{
  "bootstrap_reference": true,
  "semantic_authority": false
}
```

正式三张黄金图齐备后，临时 bootstrap 依赖结束。

### 9.3 跨主题压力测试

每个模式使用三张不进入黄金集的临时 probe：

- 新主题封面：检查主题变化后的视觉身份；
- 新隐喻概念图：检查构图变化后的家族连续性；
- 新拓扑技术图：检查内容变化后的样式稳定与语义隔离。

probe 失败只修正失败规则或资产，不增加第四张永久黄金图。

### 9.4 相邻模式区分

重点区分：

- Style 1 与 Style 2；
- Style 7 与 Style 8；
- Style 4 与 Style 5；
- Style 3 与 Style 6。

相同测试主题经两个相邻模式编译后，Visual DNA、角色契约和禁止项必须产生可观察差异。若预期结果仍可能相同，模式保持 `candidate`。

### 9.5 晋级条件

`candidate -> approved` 需要同时满足：

- 三张黄金图角色完整且各自获得用户批准；
- 所有协议、提示词、源文件和资产哈希正确；
- Visual DNA、角色契约和参考矩阵完整；
- GPT Image 编译与 preflight lint 通过；
- 三个跨主题 probe 通过；
- 相邻模式区分通过；
- 不存在黄金内容复制、主题污染或语义拓扑错误。

## 10. Manifest v2 兼容策略

Style Pack v3 不要求把 Manifest 升级为 v3。新任务在现有 `style` 和资产验证结构中增加：

- `style_pack_version`；
- `visual_dna_path` 和哈希；
- `role_contracts_path` 和哈希；
- `reference_matrix_path` 和哈希；
- `adapter_id` 和 adapter 版本；
- `prompt_ir_path` 和哈希；
- `compiled_prompt_path` 和哈希；
- per-asset drift 结果和错误代码。

已有 Manifest v1 和旧 v2 保持原有验证与集成行为。缺少 `style_pack_version` 的旧任务不会被静默升级。更新后的 Skill 创建的新任务必须声明 Style Pack v3；不存在完整 v3 pack 的模式返回 `golden_set_pending` 或 `style_pack_pending`。

## 11. 注册中心与原子迁移

`style-registry.json` 每个 profile 增加：

```json
{
  "style_pack_version": 3,
  "visual_dna_path": ".../visual-dna.json",
  "role_contracts_path": ".../role-contracts.json",
  "reference_matrix_path": ".../reference-matrix.json",
  "adapter_ids": ["gpt-image"]
}
```

profile 的 `style_pack_version` 只在对应文件、测试和资格状态均完成时原子切换。这样 Style 8 可以先迁移，模式 1–7 继续保持 `candidate`，不会出现注册中心指向半成品文件。

## 12. 测试策略

实施遵循 RED–GREEN–REFACTOR。修改生产规则前先记录当前失败基线：现有 validator 不会因缺少 Prompt IR、Visual DNA、角色契约或继承矩阵而失败。

新增测试覆盖：

1. Style Pack schema 缺字段时失败；
2. 三种角色均能编译完整八区块提示词；
3. 模式不能加载另一模式的黄金图、token 或矩阵；
4. 编译结果禁止复制黄金图文字、数字、节点和拓扑；
5. 技术图缺冻结语义图时不能编译；
6. publication theme 不能修改 Visual DNA；
7. Style 8 新编译结果保留现有黄金图的已批准视觉特征；
8. candidate、缺 probe、缺区分测试或缺用户批准时 release 失败；
9. 旧 Manifest v1/v2 合法样例继续通过；
10. `apply_visual_plan.py` 的路径、BOM、换行符、幂等和非覆盖测试保持通过。

图像生成不进入普通单元测试。视觉 probe 由明确的人工/结构化审核门记录，后续可在不改变晋级规则的前提下增加 VLM 或相似度证据。

## 13. 实施阶段

### 阶段 1：基础设施

- 增加 Style Pack 和 Prompt IR schema；
- 增加 GPT Image adapter；
- 实现提示词编译器和 preflight lint；
- 扩展 validator；
- 先写失败测试再实现。

### 阶段 2：Style 8 原子迁移

- 从现有批准资产提取结构化字段；
- 保留现有图片、哈希和批准记录；
- 运行编译回归和三个跨主题 probe；
- 通过后把 Style 8 注册为 Style Pack v3。

### 阶段 3：逐模式生产

顺序为：Style 1、Style 2、Style 7、Style 4、Style 5、Style 3、Style 6。每个模式单独完成三张黄金图、probe、区分测试、用户批准和提交。

### 阶段 4：可选视觉评分

增加 VLM 或图像相似度适配接口，但不替代用户对黄金图和文章锚点的最终批准。

## 14. 失败关闭规则

- 缺少 Style Pack 或 Prompt IR：停止，不生成自由提示词；
- 同角色黄金图或引用矩阵缺失：停止正式生产；
- 技术图缺冻结语义图：停止渲染；
- 黄金图哈希漂移：撤销发布资格并等待检查；
- probe 或相邻模式区分失败：保持 `candidate`；
- 旧 Manifest：按旧协议读取，不静默转换；
- 任何语义正确性与视觉一致性冲突：语义正确性优先；
- 任何自动视觉判断与用户黄金图审批冲突：用户明确审批优先，但不得放宽技术拓扑安全。

## 15. 完成标准

- 八种入口和现有工作流门保持不变；
- Style 8 在不更换黄金图的前提下完成 v3 迁移；
- 模式 1–7 分别拥有三张用户批准黄金图和完整 Style Pack；
- 同模式的封面、概念图和技术图既有家族相似性，又不退化为同一模板；
- 技术图不复制黄金图逻辑，节点和边与冻结语义图一致；
- 页面主题不污染图片模式；
- 每次提示词可复现、可 lint、可追溯；
- 漂移失败能映射到结构化字段；
- 新旧 Manifest 和现有 Markdown 集成回归均通过。

## 16. 参考来源与使用边界

- `awesome-gpt-image-2`：https://github.com/freestylefly/awesome-gpt-image-2
- 工业提示词模板与防坑指南：https://github.com/freestylefly/awesome-gpt-image-2/blob/main/docs/templates.md
- GPT Image Style Library Skill：https://github.com/freestylefly/awesome-gpt-image-2/tree/main/agents/skills/gpt-image-2-style-library
- 本项目 Style 8 黄金集：`skills/article-visual-director/assets/style-anchors/handwritten-systems-explainer`

外部仓库只提供方法论和公开结构参考。本项目不直接收录其第三方案例图片，不复制受第三方权利约束的内容，也不把外部案例语义作为文章事实。
