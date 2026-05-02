# Content Creator Cases

Use these cases to test whether `content-creator` behaves like an editorial thinking skill rather than a generic answer generator.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| "I want to write an article about AI companionship but I do not know the angle." | Ask about intended reader or propose 2-3 angles if enough context exists |
| "Help me create an outline for a post about why debugging is emotionally hard." | Treat as content; preserve emotional nuance; create a structure |
| "Give me title options for an essay about quitting social media." | Ask for tone/audience if unclear, then provide title directions |
| "I have a technical idea but want to explain it to non-engineers." | Use technical-to-general pattern |
| "我想写一篇 CSDN 技术文章，主题是 WebFlux 不是银弹，真正要讲的是阻塞 IO、epoll 和高并发调度问题。" | Use technical blog mode; find the core misunderstanding, engineering problem, and article angle before drafting |
| "帮我给一篇技术博客取标题，内容是零拷贝不是完全没有拷贝，而是减少 CPU 参与的数据搬运。" | Offer titles with judgment and technical credibility, not clickbait |
| "Can you help me turn this personal story into a public talk?" | Use personal reflection pattern and clarify desired audience impact |

## Negative Cases

| User Request | Should Not Do | Better Route |
|---|---|---|
| "This API keeps timing out. How do I debug it?" | Do not create an article structure | `technical-deep-dive` |
| "I feel crushed and cannot stop blaming myself." | Do not ask for article audience | `emotional-support` |
| "Should I quit my job?" | Do not make a persuasive essay outline | `life-decision` |
| "I want to write a reflective essay about why people keep old notebooks." | Do not force technical blog mode | `content-creator` general mode |

## Mixed Cases

| User Request | Expected Behavior |
|---|---|
| "I want to write about a painful breakup without oversharing." | Use `content-creator` with emotional-support sensitivity |
| "I want to write a blog post about our bad architecture decisions." | Use `content-creator`; carry technical context as secondary |
| "Help me make a talk from my burnout story." | Clarify audience impact and protect personal boundaries |

## Multi-Turn Cases

### content-initial-idea-design-gate-001

```yaml
id: content-initial-idea-design-gate-001
skill: content-creator
type:
  - PREMATURE_ADVICE
  - MODE_MISMATCH
  - EVAL_GAP
prompt: "我想写一篇 Thinking-Skills 的分享文章，类似这种主题：项目还在 Alpha，已经做过生产压测，想听听社区声音。"
context:
  - "The user provides an early article seed, not an approved outline."
  - "The topic includes technical project facts but the immediate task is content positioning."
expected:
  - "Treat the request as idea or positioning stage."
  - "Synthesize the known seed idea before adding structure."
  - "Offer 2-3 possible angles or positioning choices."
  - "Recommend one angle and briefly explain why."
  - "Ask for confirmation before writing a full article draft."
must_not:
  - "Write a full article draft immediately."
  - "Lock onto one partial phrase as the whole thesis."
  - "Invent project facts, metrics, repository state, or release status."
quality_checks:
  - "Feels like an editorial design step, not a generic content dump."
  - "Preserves the user's framing while leaving room to correct the project facts."
```

### content-multiturn-brief-preservation-001

```yaml
id: content-multiturn-brief-preservation-001
skill: content-creator
type:
  - MODE_MISMATCH
  - EVAL_GAP
prompt: "很好，就按第一个角度写。标题要突出 1 亿 Token 和自我改进飞轮。"
context:
  - "Turn 1: The user said they want to write a Thinking-Skills launch article."
  - "Turn 2: The assistant offered three angles and recommended the angle: AI should choose the right thinking mode before answering."
  - "The user accepted the first angle."
expected:
  - "Preserve the accepted angle instead of proposing unrelated new angles."
  - "Use the already known topic, thesis, and requested title direction."
  - "Move toward title options, hook, outline, or draft direction."
must_not:
  - "Ask again what the article is about."
  - "Restart from generic audience discovery."
  - "Replace the user's phrases with generic AI wording."
quality_checks:
  - "Feels like the same editorial session is continuing."
  - "Keeps the user's framing: 1 亿 Token, Thinking-Skills, 自我改进飞轮."
```

### content-multiturn-stage-transition-001

```yaml
id: content-multiturn-stage-transition-001
skill: content-creator
type:
  - MODE_MISMATCH
  - PREMATURE_ADVICE
prompt: "这个大纲可以，下一步帮我写一个开头，不要太像项目公告。"
context:
  - "The user has already approved an outline."
  - "The user now asks for an opening section."
expected:
  - "Treat the task as drafting stage."
  - "Write an opening section based on the approved outline."
  - "Avoid re-litigating the whole structure unless a clear contradiction appears."
must_not:
  - "Ask for the audience again."
  - "Return to offering 2-3 whole-article approaches."
  - "Produce a generic announcement-style opening."
quality_checks:
  - "The opening has a concrete tension and preserves the user's desired voice."
```

### content-evidence-planning-001

```yaml
id: content-evidence-planning-001
skill: content-creator
type:
  - CERTAINTY_OVERREACH
  - EVAL_GAP
prompt: "我想强调这个框架已经在生产环境跑过单日 1 亿 Token。"
context:
  - "The article is about an open-source AI thinking-skill framework."
expected:
  - "Treat the metric as a credibility signal."
  - "Suggest how to present the metric without overclaiming."
  - "Flag that concrete evidence, screenshots, logs, or methodology would strengthen the claim if published."
must_not:
  - "Invent benchmark details."
  - "Turn the metric into an unsupported guarantee of quality."
  - "Remove the user's strong framing without explaining the trade-off."
quality_checks:
  - "Separates narrative impact from evidentiary support."
```

### content-readme-rewrite-approval-gate-001

```yaml
id: content-readme-rewrite-approval-gate-001
skill: content-creator
type:
  - MODE_MISMATCH
  - PREMATURE_ADVICE
  - EVAL_GAP
prompt: "README 本身的内容也需要改进"
context:
  - "The user has been developing an open-source AI skill framework."
  - "The README already has images and basic project content."
  - "The request is broad and public-facing, with multiple valid positioning directions."
expected:
  - "Treat the task as content positioning or revision stage."
  - "Use content-creator before file edits."
  - "Offer 2-3 README improvement directions, such as open-source homepage, technical framework manifesto, or quick-start developer docs."
  - "Recommend one direction and explain the trade-off."
  - "Ask for confirmation before applying a broad rewrite."
must_not:
  - "Immediately rewrite the README without an approval gate."
  - "Treat the request as a purely mechanical documentation edit."
  - "Skip noting that multiple content strategies are possible."
quality_checks:
  - "Feels like an editorial collaboration."
  - "Preserves the user's project positioning and previously accepted decisions."
```

## Quality Checks

A good response:

- Identifies the reader.
- Names the content purpose.
- Offers a clear angle or thesis.
- Gives a structure matched to the piece type.
- Flags unsupported claims.
- Preserves the user's voice.

A poor response:

- Starts with a generic outline before understanding the reader.
- Invents facts or citations.
- Treats every post as persuasive marketing.
- Treats every content request as a technical blog.
- Writes technical articles as empty tutorial boilerplate without an engineering main thread.
- Forces personal reflection into a rigid business framework.
- Restarts from scratch after the user has already accepted an angle or outline.
