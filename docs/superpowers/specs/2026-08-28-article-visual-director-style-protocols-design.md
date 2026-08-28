# Article Visual Director：八种视觉协议稳定化设计

日期：2026-08-28
状态：设计已讨论，等待书面复核
目标 Skill：`skills/article-visual-director`

## 1. 背景与问题

`article-visual-director` 当前提供八种固定视觉模式，已经成为用户日常文章配图的稳定入口。模式名称和顺序具备长期使用价值，但同一模式在不同文章、不同会话以及不同渲染器之间的成品风格不稳定。

当前根因不是模式数量不足，而是模式主要以短文本 fingerprint 和 prompt fragment 表达。短文本能够指示方向，却不能稳定约束线条行为、材质、色彩角色、字体、构图、透视和禁止特征。另一个关键问题是页面主题、插图风格和单图语义没有被强制分离。例如 `green` 页面主题可能错误地把 Handwritten Systems Explainer 变成浅绿色企业卡片风。

现有风格锚点仅在计划包含三张以上 `imagegen` 资产时触发。对于“一张 imagegen 封面 + 多张确定性图表”的混合工作流，这个条件无法阻止封面和正文图表形成两套视觉语言。

## 2. 目标

本次改造需要实现以下结果：

1. 保留八种模式的现有序号、英文名、中文名和稳定 `profile_id`。
2. 把每种模式从文本标签升级为可复现、可审计、可版本化的视觉协议。
3. 每种模式建立三张经用户明确批准的自有黄金参考图。
4. 同一协议同时约束 `imagegen` 插画和 SVG/HTML 等确定性图表。
5. 强制分离页面主题、视觉模式和单图语义，阻止主题污染。
6. 用文章级风格锚点保证当前文章的跨图与跨渲染器一致性。
7. 增加客观协议验证、人工视觉审批和回归测试。
8. 新任务使用 Manifest v2，同时保持旧 Manifest v1 可验证、可集成。

## 3. 非目标

- 不新增第九种模式，也不重新命名或重新排序现有八种模式。
- 不用自动相似度分数替代用户的审美确认。
- 不直接收录第三方仓库中的示例图片作为黄金资产。
- 不要求所有文章生成同样数量的图片。
- 不改变非破坏性 Markdown 集成、源文件哈希校验和安全路径规则。
- 不把文章页面的品牌色强制覆盖到插图视觉协议中。

## 4. 总体架构

入口 Skill 保留共享状态机和安全约束，详细模式信息通过渐进披露拆分到独立协议文件：

```text
skills/article-visual-director/
├─ SKILL.md
├─ references/
│  ├─ style-catalog.md
│  ├─ style-protocol-schema.md
│  ├─ manifest-schema.md
│  ├─ platform-profiles.md
│  └─ styles/
│     ├─ 01-technical-editorial-minimal.md
│     ├─ 02-white-green-editorial-minimal.md
│     ├─ 03-neon-systems.md
│     ├─ 04-blueprint-linework.md
│     ├─ 05-isometric-infrastructure.md
│     ├─ 06-cinematic-conceptual.md
│     ├─ 07-soft-technical-sketch.md
│     └─ 08-handwritten-systems-explainer.md
├─ assets/
│  └─ style-anchors/
│     └─ {profile_id}/
│        ├─ golden-cover.png
│        ├─ golden-concept.png
│        ├─ golden-diagram.png
│        └─ golden-set.json
└─ scripts/
   ├─ validate_style_contract.py
   └─ tests/
```

`style-catalog.md` 只保留八种模式的菜单、选择线索和协议链接。每次用户选择模式后，只读取对应的独立协议，避免一次加载全部细节。

## 5. 视觉协议结构

每个模式协议必须完整定义以下字段和规则：

### 5.1 身份与适用范围

- 固定序号、英文名、中文名和 `profile_id`；
- 协议版本；
- 适用文章信号；
- 不适用场景；
- 与相邻模式的差异边界。

### 5.2 核心设计令牌

- 背景与表面；
- 主墨色、辅助色和语义色角色；
- 线条粗细、规则度、边缘和笔触行为；
- 标题、标签、正文的字体体系与中英文后备字体；
- 节点、边界、箭头、圆角和分组的几何规则；
- 平面、正交、等距或电影透视；
- 光影、纹理、留白与空间密度；
- 允许和禁止的装饰。

### 5.3 资产角色变体

每个协议分别定义：

- `cover`：宽幅占用、视觉焦点和裁切存活；
- `concept`：单一隐喻、主体层级和正文列宽可读性；
- `process` / `architecture`：节点、边界和方向的确定性表达；
- `comparison`：左右或上下对比的共享基线；
- `timeline` / `chart`：信息密度、标签和刻度规则。

### 5.4 双渲染器契约

`imagegen` 契约包含完整的正向提示词块、参考图角色、必须保留项、允许变化项和负面约束。确定性契约包含 SVG/HTML 的颜色、字体、线宽、圆角、阴影、纸张纹理、箭头和布局令牌。

二者共享同一语义色角色和几何语言，但不要求逐像素相同。例如 Cinematic Conceptual 的封面可以具有环境纵深，其确定性图表则使用同一配色、标题体系和克制层级，而不是把流程图变成电影场景。

### 5.5 验收量表

每个协议列出：

- 必须出现的视觉特征；
- 允许变化的特征；
- 一旦出现即失败的禁止特征；
- 与黄金图比较时需要观察的维度；
- 页面主题可覆盖和不可覆盖的部分。

## 6. 八种模式的不可替代身份

| 序号 | 模式 | 核心身份 | 必须排除 |
|---|---|---|---|
| 1 | Technical Editorial Minimal | 精确平面几何、编辑网格、墨蓝与单一强调色、现代无衬线字体 | 手绘笔触、企业仪表盘、3D |
| 2 | White-Green Editorial Minimal | 白或浅薄荷背景、祖母绿层级、横向编辑构图、明亮理性 | 环保树叶、浅绿卡片堆叠、玻璃拟态 |
| 3 | Neon Systems | 深海军蓝、青绿信号路径、模块化暗色系统、受控辉光 | 赛博朋克城市、HUD 乱码、彩虹霓虹 |
| 4 | Blueprint Linework | 正交工程线稿、统一细线、蓝图或绘图纸、剖面与边界 | 伪造尺寸、写实渲染、等距空间 |
| 5 | Isometric Infrastructure | 固定等距视角、哑光模块、空间化系统路径、一致比例 | 随机透视、服务器堆积、虚构拓扑 |
| 6 | Cinematic Conceptual | 单一强隐喻、戏剧光影、环境纵深、清晰剪影 | 多模块信息图、抽象炫技、默认人物脸 |
| 7 | Soft Technical Sketch | 铅笔或墨线、低饱和水彩、友好教学隐喻、轻盈纸面 | 儿童涂鸦、企业卡片、强黑框与高饱和色 |
| 8 | Handwritten Systems Explainer | 粗黑手绘线、技术手账、米白纸、高饱和橙蓝绿、直接箭头与黑色标签页 | 淡彩水彩、规整企业流程图、3D 棱镜、浅绿主题侵入 |

Style 7 表达柔软、低饱和、教学插画和生活化隐喻。Style 8 表达有力、高对比、工程手账、系统关系与前后对比。二者不得共享冲突性设计令牌。

## 7. 三层职责与覆盖优先级

新工作流明确区分：

```text
publication_theme = 发布页面与确定性标题层的主题
visual_profile    = 插图和图表的视觉语言
asset_semantics   = 当前图片表达的具体信息
```

优先级为：视觉协议不变量高于页面主题覆盖。页面主题默认只能影响页面排版、封面确定性文字层和协议明确允许的点缀。替换插图主色、线条、材质、透视或几何语言必须在配图计划中单独说明并获得批准。

`publication_theme=green` 不得自动修改 Handwritten Systems Explainer 的纸张、粗黑线、高饱和语义色或黑色标签页。

## 8. 黄金参考图生命周期

每个模式建立一套由以下三张图组成的黄金资产：

1. `golden-cover`：验证宽幅构图、视觉焦点和裁切行为；
2. `golden-concept`：验证正文概念插画的主体、材质和空间；
3. `golden-diagram`：验证确定性图表的线条、字体、箭头和语义色。

三张黄金图均由本项目重新生成，并在成套展示后由用户确认。用户拥有且明确认可的历史成品只作为生成时的视觉参考，不自动晋升为黄金资产。外部案例只用于提炼通用视觉属性，不直接复制为 Skill 资产。

生产顺序为 Style 8、Style 7、Style 1、Style 2、Style 3、Style 4、Style 5、Style 6。先用 Style 8 的已认可历史成品校准方法，再处理最容易混淆的相邻模式。

每个模式按以下状态流转：

```text
draft protocol
  -> generate cover/concept/diagram candidates
  -> present the three-image set to the user
  -> revise failed members only
  -> user approves the set
  -> persist as approved golden set
```

未获用户确认的图片保持 `candidate`，不能被正式文章工作流引用。`golden-set.json` 保存协议版本、提示词、参考来源角色、文件路径、尺寸、哈希、批准状态和用户修订说明。黄金文件或协议发生变化后，批准状态自动失效，必须重新确认。

## 9. 文章级风格锚点

黄金图定义模式身份，文章级锚点证明该模式能正确落到当前文章。以下任一条件成立时必须生成文章级风格锚点：

- 计划包含任何 `imagegen` 资产；
- 计划同时包含 `imagegen` 和确定性资产；
- 用户提供了文章专属参考图；
- 所选协议或黄金图版本发生变化。

只有单张纯确定性资产、使用已批准且未变更的协议、没有文章专属参考图时，才可把文章级锚点标记为 `not_required`。

文章级锚点批准后：

- 后续 `imagegen` 同时携带黄金参考图和已批准文章锚点；
- 确定性资产读取同一协议的设计令牌，并以文章锚点检查系列一致性；
- 锚点被拒绝时，只允许修订协议覆盖项或重新生成锚点，不得继续批量生产。

## 10. 文章工作流状态机

```text
inspect article
  -> present the existing eight bilingual modes
  -> wait for explicit style selection
  -> load selected protocol and approved golden set
  -> separate publication theme, visual profile, and asset semantics
  -> propose complete visual plan
  -> wait for plan approval
  -> evaluate article-style-anchor requirement
  -> generate and approve the anchor when required
  -> render remaining imagegen and deterministic assets
  -> validate semantics, visual contract, and series continuity
  -> create a new illustrated Markdown copy
```

模式选择、计划审批、文章锚点审批和最终资产验证是独立状态，不得互相推断。

## 11. Manifest v2 与兼容性

验证器同时接受 Manifest v1 和 v2。旧 v1 保持现有验证与集成行为，不要求补填新字段。新任务默认创建 v2。

Manifest v2 的 `style` 至少记录：

- `profile_id`；
- `profile_version`；
- `protocol_path`；
- `golden_set_path`；
- `golden_reference_ids`；
- `publication_theme`；
- `theme_override_policy`；
- 文章级 fingerprint 与允许覆盖项。

`approvals` 使用 `article_style_anchor` 取代含义模糊的计数型 `style_anchor`。v1 的原字段继续按旧规则解析。

每个 v2 资产增加 `style_validation`，记录黄金参考 ID、必须特征检查、禁止特征、主题污染、系列一致性、审核结论和修订说明。

`apply_visual_plan.py` 不负责创造或猜测缺失的风格状态。v2 在集成阶段必须已经通过协议、审批、语义和视觉验证。

## 12. 验证策略

验证分为四层：

### 12.1 协议完整性

`validate_style_contract.py` 检查八个固定身份、协议文件、必需章节、黄金资产、批准状态、文件尺寸和哈希。任何缺失、重复、被替换或未批准的黄金资产都失败关闭。

### 12.2 Manifest 状态

Manifest v2 在渲染与集成前检查协议版本、黄金集合、主题覆盖策略、文章锚点要求和资产审批状态。主题越权、协议版本漂移或锚点缺失时不得继续。

### 12.3 视觉审核

视觉审核根据模式专属量表检查必须特征、禁止特征、主题污染和系列连续性。自动审核提供结构化证据；用户对黄金图和文章锚点的明确批准是最终审美依据。

### 12.4 语义与发布验证

保留现有节点、边、标签、边界、标题、宽幅占用、安全区、中央方形裁切和正文列宽检查。视觉一致性不得降低技术语义和发布可用性要求。

## 13. 测试与回归

新增或扩展测试覆盖：

1. 八种模式名称、顺序和 `profile_id` 不可意外改变；
2. 八个协议文件均满足结构契约；
3. Style 7 与 Style 8 不得包含冲突性核心令牌；
4. 页面主题与视觉模式在 v2 中独立保存；
5. 未声明的主题覆盖被拒绝；
6. 混合 `imagegen + deterministic` 计划必须批准文章锚点；
7. 单张纯确定性资产在满足全部条件时可跳过锚点；
8. 候选图片不能作为黄金图；
9. 黄金资产缺失、哈希变化或协议版本漂移时失败关闭；
10. v1 与 v2 Manifest 都能通过各自合法样例；
11. v2 未完成风格验证时不能集成；
12. 现有 BOM、换行符、路径安全、幂等与非覆盖测试继续通过。

图像生成不进入普通单元测试，以免引入网络、费用和随机性。黄金图的视觉批准通过人工门记录，仓库测试只验证其身份、完整性和不可篡改性。

## 14. 实施阶段划分

实施按以下阶段进行：

1. 建立协议结构、固定身份和契约验证器；
2. 升级 Manifest v2 与兼容验证；
3. 修改 Skill 状态机、主题分离和文章锚点规则；
4. 编写八个模式协议草案与确定性设计令牌；
5. 按既定顺序逐模式生成三张候选图并等待用户批准；
6. 批准后写入黄金集合元数据和哈希；
7. 完成全量单元测试、契约测试和一篇混合渲染回归案例。

阶段 5 是持续审批阶段。任何尚未拥有批准黄金集合的模式必须在正式工作流中显示为 `golden_set_pending`，不能伪装成已经稳定。

## 15. 成功标准

改造完成必须同时满足：

- 八种原有入口保持不变；
- 每种模式拥有独立协议和三张用户批准黄金图；
- 同一模式的封面、概念图和确定性图表被用户判断为同一视觉家族；
- Style 7 与 Style 8 能被清楚区分；
- 页面主题不能静默覆盖插图核心视觉语言；
- 任意含 `imagegen` 的新文章在批量生产前都经过文章锚点确认；
- v1 合法清单继续工作，v2 非法或未批准状态失败关闭；
- 现有安全与集成测试及新增回归测试全部通过。
