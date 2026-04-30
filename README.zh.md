# Thinking Skills

一个独立的、领域中立的思考技能框架，用来把用户请求路由到合适的思考模式。

[English](./README.md) | 简体中文

## 问题所在

很多 agent skills 有一个隐藏默认值：它们会把不明确的请求理解成软件开发任务。

这对 coding workflow 很有用，但当用户是在写文章、做生活决策、处理情绪问题、探索创意，或者需要非技术类思考支持时，这种默认就会出错。

## 解决方案

Thinking Skills 把“路由”和“推理”分开：

| 层级 | 责任 |
|---|---|
| `thinking-router` | 判断用户意图，并路由到合适的思考模式 |
| Domain skills | 用领域专属的问题、输出形态和安全边界处理真实对话 |
| Method bases | 显式声明方法论底座，而不是只依赖大模型的通用能力 |
| Evals | 测试路由准确性、领域匹配度和边界行为 |

## 第一方 Skills

| Skill | 适用场景 |
|---|---|
| `thinking-router` | 用户请求需要先判断应该进入哪种思考模式 |
| `content-creator` | 文章、随笔、脚本、标题、大纲、论点、受众定位和内容结构 |
| `technical-deep-dive` | 代码、架构、debug、性能、API、系统、技术权衡和验证路径 |
| `emotional-support` | 焦虑、压力、自责、关系痛苦、情绪困惑、危机信号和温和的下一步 |

规划中的 skills：

- `life-decision`
- `creative-studio`
- `learning-coach`
- `business-strategy`

## 安装

### Install the skill with Skills CLI:

```bash
npx skills add huajiexiewenfeng/thinking-skills
```

本地开发时，可以在仓库根目录运行：

```bash
npx skills add .
```

这会通过 Skills CLI 安装 Thinking Skills 仓库。

### Codex native skill discovery

参见 [`.codex/INSTALL.md`](.codex/INSTALL.md)。

### Codex plugin

本仓库包含 Codex plugin manifest：

```text
.codex-plugin/plugin.json
```

### Claude Code、Cursor 和 OpenCode

本仓库也包含这些平台的薄适配层：

```text
.claude-plugin/
.cursor-plugin/
.opencode/
```

参见 [Platform Support](docs/platforms.md)。

## 使用方式

安装后，重启 Codex，让 Codex 重新发现 skills。

你可以自然地提问：

```text
我有个想法，想把它梳理清楚。
```

```text
帮我写一篇关于 AI 陪伴的文章。
```

```text
我最近很焦虑，总是在责怪自己。
```

```text
这个 API 设计感觉不对，帮我分析一下权衡。
```

如果想强制使用某个 skill，可以直接点名：

```text
使用 thinking-router 帮我判断这个请求应该进入哪种思考模式。
```

```text
使用 content-creator 帮我找文章角度和大纲。
```

```text
使用 emotional-support 帮我梳理现在的感受。
```

当前 Codex 会话里，新安装的 skills 可能需要重启 Codex 后才会出现在可用列表中。

## 核心原则

- **默认领域中立** - 不要默认这是软件开发问题。
- **Router 只路由，不解决问题** - 先选择 thinking mode，再由对应 skill 推理。
- **每个 skill 拥有自己的世界观** - 不同领域有不同的问题、输出和边界。
- **方法论优先于泛泛聊天** - 每个 domain skill 都要声明 method bases。
- **一次只问一个问题** - 澄清问题时不要压垮用户。
- **输出形态跟随领域** - 写作、技术分析和情绪支持不应该套用同一个模板。
- **安全边界很重要** - 高风险领域需要明确的升级求助和范围限制。

## 如何判断它在起作用

如果你看到以下情况，说明 Thinking Skills 正在发挥作用：

- 非技术请求不再被强行塞进 coding workflow。
- 写作任务会产出受众、角度、论点和结构，而不是 implementation plan。
- 技术任务会区分事实、假设、推测、权衡和验证路径。
- 情绪支持任务会接住情绪、避免诊断，并在必要时优先处理安全问题。
- 模糊请求只触发一个简短的路由问题，而不是一长串问卷。

## 文档

- [Roadmap](docs/roadmap.md)
- [Routing](docs/routing.md)
- [Method Bases](docs/method-bases.md)
- [Safety](docs/safety.md)
- [Evaluation](docs/evaluation.md)
- [Platform Support](docs/platforms.md)
- [Skill Authoring](docs/skill-authoring.md)
- [Contributing](CONTRIBUTING.md)

## 与 Superpowers 的关系

Thinking Skills 独立于 Superpowers。

它借鉴 skill-based workflows 中有价值的结构思想，但不依赖 Superpowers、它的 runtime、命名方式或 coding-first 约定。

## 许可

MIT
