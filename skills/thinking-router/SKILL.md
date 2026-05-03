---
name: thinking-router
description: Use at the start of a user request to classify intent and route to the most appropriate domain-specific thinking skill. Do not assume software development unless explicitly indicated.
---

# Thinking Router

## Purpose

`thinking-router` is the entry point for Thinking Skills.

It classifies the user's request and routes it to the best domain-specific thinking skill. It does not answer the user's substantive question.

## Hard Rules

1. Do not solve the user's substantive problem inside this skill.
2. Do not assume the request is about software development.
3. Choose exactly one primary skill.
4. Add at most one secondary skill when mixed intent is important.
5. If routing confidence is low, ask one short routing question.
6. After routing, follow the selected domain skill's method bases and process.

## Method Bases

This skill does not use domain method bases directly.

It relies on:

- Intent classification
- Signal matching
- Confidence judgment
- Conflict resolution

Domain skills own their own method bases. For example, `emotional-support` may use CBT, ACT, NVC, and safety models; `technical-deep-dive` may use systems thinking and root cause analysis.

## Routing Process

1. Read the user's request.
2. Identify domain signals.
3. Check for high-stakes or safety signals.
4. Select one primary skill.
5. Optionally select one secondary skill.
6. If confidence is low, ask one short routing question.
7. Announce the selected skill briefly and proceed with that skill.

## Confidence Levels

| Confidence | Meaning | Action |
|---|---|---|
| High | One domain clearly dominates | Route directly |
| Medium | One domain is primary, but another matters | Route to the primary skill and carry the secondary context |
| Low | The request is underspecified or several domains fit equally | Ask one short routing question |

## MVP Routing Table

| User Signals | Primary Skill |
|---|---|
| benchmark, eval, regression test, score, dashboard, test a skill, run benchmark, compare benchmark runs, 跑 benchmark, 做评测, 回归测试, 看分数, 更新 dashboard | `benchmark-assistant` |
| article, essay, blog, newsletter, title, outline, audience, argument, draft, script, content plan, writing style | `content-creator` |
| code, repo, architecture, bug, performance, API, tests, deployment, implementation, source code, framework, database, refactor | `technical-deep-dive` |
| learn, study, understand, explain, concept, intuition, mental model, knowledge gap, course, practice, exam, review, what is, how does, I do not understand, 学习, 理解, 解释, 概念, 心智模型, 知识盲区, 看不懂, 学不会 | `learning-coach` |
| anxious, overwhelmed, sad, self-blame, stress, burnout, relationship pain, emotional pain, confused feelings, shame, fear, why am I like this, why do I always, help me see the essence, find the main thread, do not just comfort me, stop only asking questions, 看本质, 抓主线, 不要只安慰, 别一直问, 你来判断, 为什么我总是这样, 为什么我反应这么大 | `emotional-support` |
| self-review, Dolores, Dolores mode, 自我检查, 自我复盘, 对话复盘, skill 使用复盘, review this conversation, audit skill usage, failure case review, failure case status, failure case dashboard, quality dashboard, skill feedback statistics, eval gap review, improvement loop, patch strategy for this conversation, 失败 case 统计, 改进状态统计, skill 反馈统计 | `conversation-review` |

## Planned Routing Table

| User Signals | Primary Skill |
|---|---|
| choice, habit, schedule, personal plan, life trade-off, relationship communication, whether I should | `life-decision` |
| naming, story, worldbuilding, visual concept, product idea, creative direction, character, brand concept | `creative-studio` |
| customer, market, offer, pricing, positioning, business model, competitor, growth, sales | `business-strategy` |

## Mixed Intent

When a request contains multiple domains, choose the primary skill based on the user's immediate need.

Learning intent has priority over technical nouns when the user asks to understand, learn, explain, build intuition, or fix a knowledge gap. Technical nouns alone do not make the request a `technical-deep-dive`.

Use `technical-deep-dive` instead when the user needs diagnosis, architecture choice, implementation guidance, source-level reasoning, adoption decisions, debugging, performance analysis, or verification.

Examples:

| Request | Route |
|---|---|
| "I want to write an article about why this API design is confusing." | Primary: `content-creator`; Secondary: `technical-deep-dive` |
| "Explain Kafka like I am new to distributed systems." | Primary: `learning-coach`; Secondary: `technical-deep-dive` |
| "Can you help me understand this API design before we decide whether to adopt it?" | Primary: `technical-deep-dive`; Secondary: `learning-coach` |
| "I am anxious because my project architecture is a mess." | Primary: `emotional-support`; Secondary: `technical-deep-dive` |
| "Help me decide whether to quit my job and build a startup." | Primary: `life-decision`; Secondary: `business-strategy` |
| "Help me turn my burnout story into a blog post." | Primary: `content-creator`; Secondary: `emotional-support` |
| "Do not just comfort me. Tell me what pattern you see in why I keep reacting this way." | Primary: `emotional-support`; Secondary: none |
| "Do a self-review of this conversation and tell me whether there is an eval gap." | Primary: `conversation-review`; Secondary: `skill-evaluator` |

## Safety Override

If the user expresses immediate danger, self-harm, harm to others, abuse, coercion, psychosis, mania, severe impairment, or urgent medical/legal/financial risk, route to the safest relevant domain and prioritize safety boundaries.

For MVP, emotional crisis signals route to `emotional-support`.

The selected skill must not diagnose, claim to provide therapy, or replace professional support.

## Low-Confidence Question

When the route is unclear, ask one short question:

```text
Do you want to approach this mainly as writing, technical analysis, learning, life decision-making, emotional reflection, or creative exploration?
```

Do not ask a long intake questionnaire inside the router.

## User-Facing Announcement

When routing is clear, keep the announcement short:

```text
I will use `content-creator` to help shape the audience, angle, and structure.
```

```text
I will use `technical-deep-dive` to analyze the system, constraints, trade-offs, and verification path.
```

```text
I will use `learning-coach` to build the concept, check likely gaps, and choose the next practice step.
```

```text
I will use `emotional-support` to help sort the feelings, facts, needs, and next gentle step.
```

```text
I will use `conversation-review` in Dolores mode to review the skill trace, failure signals, and improvement options.
```

For deep emotional analysis:

```text
I will use `emotional-support` to give a tentative read of the pattern, then you can calibrate what fits.
```

## Internal Routing Record

If useful, keep this internal structure:

```text
Route: content-creator
Confidence: high
Secondary: none
Reason: User asks for article angle, audience, and outline.
Next: Load content-creator and follow its process.
```

Do not expose the full routing record unless it helps the user understand a routing choice.

## Common Mistakes

- Answering the actual user problem before routing.
- Treating every unclear request as technical.
- Loading multiple skills because several keywords appear.
- Asking many questions before routing.
- Forcing writing, life, or emotional requests into technical specs.
- Treating reflective models as clinical evidence.
- Missing emotional-support routes because the user asks for "the essence" or "the pattern" instead of using obvious emotion words.
