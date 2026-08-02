# Routing

## Router Responsibility

`thinking-router` is the entry point for Thinking Skills.

It has one job: classify the user's request and select the most appropriate domain skill.

It must not answer the substantive question.

## Routing Flow

```text
User request
  -> identify intent signals
  -> choose one primary thinking skill
  -> optionally choose one secondary skill
  -> if confidence is low, ask one short routing question
```

## Confidence Levels

| Confidence | Meaning | Action |
|---|---|---|
| High | Strong signals point to one domain | Route directly |
| Medium | One domain is likely, but another may matter | Route to primary skill and note secondary context |
| Low | Several domains fit or the request is underspecified | Ask one short routing question |

## MVP Routing Table

| Signals | Primary Skill |
|---|---|
| existing or final Markdown article, article cover, section illustration, visual plan, image prompt, process diagram, architecture diagram, insert images, illustrated copy, 已定稿文章配图, 公众号封面, CSDN 封面, 概念插画, 生成并回写 Markdown | `article-visual-director` |
| article, essay, blog, newsletter, title, outline, audience, argument, draft, script, content structure | `content-creator` |
| code, repo, architecture, bug, performance, API, tests, deployment, implementation, source, framework, database | `technical-deep-dive` |
| learn, study, understand, explain, concept, intuition, mental model, knowledge gap, course, practice, exam, review, what is, how does | `learning-coach` |
| anxious, overwhelmed, sad, self-blame, relationship pain, stress, burnout, confused feelings, emotional pain | `emotional-support` |
| self-review, Dolores, conversation review, skill trace, failure case, eval gap, improvement loop, 自我检查, 自我复盘, 对话复盘 | `conversation-review` |

## Planned Routing Table

| Signals | Primary Skill |
|---|---|
| choice, habit, schedule, personal plan, relationship communication, life trade-off | `life-decision` |
| naming, story, worldbuilding, visual concept, product idea, creative direction | `creative-studio` |
| market, positioning, offer, pricing, customer, strategy, business model | `business-strategy` |

## Mixed-Intent Examples

Learning intent has priority over technical nouns when the user asks to understand, learn, explain, build intuition, or fix a knowledge gap. Technical nouns alone do not make the request a `technical-deep-dive`.

Use `technical-deep-dive` instead when the user needs diagnosis, architecture choice, implementation guidance, source-level reasoning, adoption decisions, debugging, performance analysis, or verification.

Use `article-visual-director` after the article exists or is substantially complete and the requested deliverable is its visual system or an illustrated Markdown copy. Keep `content-creator` primary when the angle, audience, thesis, outline, or prose still needs development. Technical architecture nouns may provide secondary context, but they do not displace the visual-director route when the immediate artifact is an article visual.

| User Request | Route |
|---|---|
| "I want to write an article about why this API design is confusing." | Primary: `content-creator`; Secondary: `technical-deep-dive` |
| "This Markdown article is final. Plan a cover, concept illustrations, and any necessary architecture diagram, then insert approved assets into a new copy." | Primary: `article-visual-director`; Secondary: none |
| "The article is final, but the Gateway-to-Runtime direction is not verified. Plan the illustration without inventing edges." | Primary: `article-visual-director`; Secondary: `technical-deep-dive` if technical verification is requested |
| "I only have an article idea; help me choose the angle before we think about illustrations." | Primary: `content-creator`; Secondary: none |
| "Explain vector databases to me. I know normal databases but not this." | Primary: `learning-coach`; Secondary: none |
| "Explain Kafka like I am new to distributed systems." | Primary: `learning-coach`; Secondary: `technical-deep-dive` |
| "Can you help me understand this API design before we decide whether to adopt it?" | Primary: `technical-deep-dive`; Secondary: `learning-coach` |
| "I am anxious because my project architecture is a mess." | Primary: `emotional-support`; Secondary: `technical-deep-dive` |
| "Help me decide whether to quit my job and build a startup." | Primary: `life-decision`; Secondary: `business-strategy` |
| "Do a self-review of this conversation and find any eval gaps." | Primary: `conversation-review`; Secondary: `skill-evaluator` |
| "Summarize what we discussed." | Primary: no Dolores trigger; provide a normal summary unless the user asks for review |

## Low-Confidence Question

When the route is unclear, ask one short question:

```text
Do you want to approach this mainly as writing, technical analysis, learning, life decision-making, emotional reflection, or creative exploration?
```

## Anti-Patterns

- Do not default to technical thinking because the framework uses skill files.
- Do not answer the user's actual problem inside the router.
- Do not route to multiple skills just because several keywords appear.
- Do not ask a long intake questionnaire before routing.
- Do not force non-technical domains into implementation plans.
- Do not route a final-article illustration workflow to `content-creator` merely because the artifact is an article.
- Do not route early writing work to `article-visual-director` merely because future illustrations are mentioned.
