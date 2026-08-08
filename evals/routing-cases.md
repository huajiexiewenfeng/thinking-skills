# Routing Cases

Use these cases to test whether `thinking-router` chooses the expected primary skill.

## Clear MVP Cases

| User Request | Expected Primary | Expected Secondary | Notes |
|---|---|---|---|
| "I want to write a blog post about AI companionship. Help me find an angle." | `content-creator` | None | Writing, audience, angle |
| "Can you help me outline an article about why people fear automation?" | `content-creator` | None | Article structure |
| "This Markdown article is final. Plan its cover, section illustrations, and architecture diagram, then insert approved assets into a copy." | `article-visual-director` | None | Stable article, visual output and workspace mutation |
| "This Java service has a memory leak. How should I investigate it?" | `native` | None | Ordinary technical debugging stays host-native |
| "I need to compare two API designs for a payment service." | `native` | None | Ordinary architecture and trade-offs stay host-native |
| "Please use `technical-deep-dive` to compare two API designs for a payment service." | `technical-deep-dive` | None | Direct current-request invocation |
| "Explain vector databases to me. I know normal databases but not this." | `learning-coach` | None | Concept explanation and mental model |
| "I read about attention in transformers but I still do not understand it." | `learning-coach` | None | Learning confusion |
| "帮我理解一下什么是检索增强生成，我总是分不清它和普通搜索。" | `learning-coach` | None | Chinese learning signal |
| "Explain Kafka like I am new to distributed systems." | `learning-coach` | None | Technical noun does not add an uninvoked secondary |
| "I feel anxious and keep blaming myself for everything." | `emotional-support` | None | Emotional support |
| "I am overwhelmed after a conflict with my friend and do not know what I need." | `emotional-support` | None | Relationship pain and needs |
| "self-review" | `conversation-review` | None | Light Dolores trigger |
| "进入 Dolores，复盘这轮对话。" | `conversation-review` | None | Full Dolores trigger |
| "Can this conversation become a failure case? Find the eval gap." | `conversation-review` | `skill-evaluator` | Conversation-level review with failure classification |
| "失败 case 统计" | `conversation-review` | None | Quality dashboard trigger |
| "quality dashboard" | `conversation-review` | None | Case and skill feedback dashboard trigger |
| "skill 反馈统计" | `conversation-review` | None | Skill feedback statistics trigger |
| "不要只是安慰我，你帮我看本质，我为什么总是这样？" | `emotional-support` | None | Deep emotional analysis signal |
| "别一直问我了，你直接说你看到的问题核心是什么。" | `emotional-support` | None | User asks for active, calibratable read |

## Mixed-Intent Cases

| User Request | Expected Primary | Expected Secondary | Notes |
|---|---|---|---|
| "I want to write an article about why this API design is confusing." | `content-creator` | None | User's output goal is writing; technical support remains host-native |
| "I want to write an article explaining vector databases to beginners." | `content-creator` | `learning-coach` | Writing output dominates; learning supports clarity |
| "I am panicking because our production architecture is failing." | `emotional-support` | None | Emotional urgency first; do not add an uninvoked technical secondary |
| "I feel stupid because I cannot understand recursion." | `emotional-support` | `learning-coach` | Shame and self-blame first |
| "Help me turn my burnout experience into a public talk." | `content-creator` | `emotional-support` | Content output with emotional material |
| "The article is final; it needs concept illustrations plus one exact runtime architecture diagram." | `article-visual-director` | None | One article-level visual plan selects multiple renderers |
| "I have not chosen the article angle yet, but later I want images." | `content-creator` | None | Writing direction must stabilize before visual planning |
| "Should I quit my job to build a SaaS product?" | `life-decision` | `business-strategy` | Planned skill, not MVP |
| "我想写一篇文章分析为什么我总是自责。" | `content-creator` | `emotional-support` | Writing output dominates, emotional context secondary |

## Ambiguous Cases

| User Request | Expected Action | Notes |
|---|---|---|
| "I have an idea and want to sort it out." | Ask low-confidence routing question | No domain signal |
| "Help me think this through." | Ask low-confidence routing question | Underspecified |
| "I need a plan." | Ask low-confidence routing question | Could be life, technical, writing, business |
| "帮我看一下这个问题的本质。" | Ask low-confidence routing question | Could be technical, emotional, business, or writing without more context |

## Anti-Cases

| User Request | Incorrect Route | Correct Route | Notes |
|---|---|---|---|
| "I want to write about software architecture for non-engineers." | `technical-deep-dive` | `content-creator` | Writing goal dominates |
| "Explain Kafka like I am new to distributed systems." | `technical-deep-dive` | `learning-coach` | Learning goal dominates over technical implementation |
| "I feel stupid because I cannot fix this bug." | `technical-deep-dive` | `emotional-support` | Emotional distress dominates |
| "Give me titles for my post about debugging." | `technical-deep-dive` | `content-creator` | Title generation is content work |
| "I only have an article idea; choose all of its images first." | `article-visual-director` | `content-creator` | Early content positioning remains primary |
| "Summarize what we discussed." | `conversation-review` | Normal summary, no skill route | Summary is not self-review or Dolores |
| "帮我分析这段关系里我为什么反应这么大。" | `life-decision` | `emotional-support` | Emotional pattern dominates over generic decision-making |
