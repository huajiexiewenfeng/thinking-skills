---
name: thinking-router
# activation-policy:frontmatter:start
description: "Use when a user request needs intent classification, especially when domain work, host-native technical work, or ordinary conversation could each fit."
# activation-policy:frontmatter:end
---

# Thinking Router

<!-- activation-policy:guard:start -->
Generated from config/activation-policy.yaml. Do not edit this block.

Activation mode: `auto`. This Skill is eligible under its authored domain boundaries. Cross-Skill routing remains owned by `thinking-router`.
<!-- activation-policy:guard:end -->

## Purpose

`thinking-router` is the entry point for Thinking Skills.

It classifies the user's request and chooses exactly one primary route: a Domain Skill, `native`, or `no-skill`. It does not answer the user's substantive question.

## Hard Rules

1. Do not solve the user's substantive problem inside this skill.
2. Do not assume the request is about software development.
3. Run the `no-skill` gate before choosing a task-shaped route.
4. Treat `native` as a first-class route for ordinary task-shaped requests when no eligible Domain Skill owns the deliverable under the generated activation policy.
5. Choose exactly one primary route: a domain skill, `native`, or `no-skill`.
6. Add at most one secondary skill when mixed intent is important.
7. Apply the generated Activation Modes rules before selecting a primary or secondary Skill. Explicit Skills require valid current-request invocation; Disabled Skills are never eligible.
8. If routing confidence is low, ask one short routing question.
9. After routing to a domain skill, follow that skill's method bases and process.
10. After routing to `native`, do not load a Thinking Skills domain skill merely to supply technical reasoning; use the host model, system and developer rules, tools, and harness.
11. After routing to `no-skill`, do not load a domain skill or apply a domain method base.

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
2. Check for high-stakes or safety signals.
3. Run the `no-skill` gate.
4. Identify domain signals.
5. Identify one primary domain candidate from domain ownership.
6. Apply the generated activation policy to resolve the candidate to a selectable Skill, `native`, or an unavailable response.
7. Optionally identify one secondary domain candidate and apply the same generated policy.
8. If confidence is low, ask one short routing question.
9. Announce the resolved route briefly only when it helps the user, then proceed.

<!-- activation-policy:router:start -->
Generated from config/activation-policy.yaml. Do not edit this block.

## Activation Modes

| Skill | Mode |
|---|---|
| `article-visual-director` | `auto` |
| `benchmark-assistant` | `auto` |
| `content-creator` | `auto` |
| `conversation-review` | `auto` |
| `emotional-support` | `auto` |
| `learning-coach` | `explicit` |
| `skill-evaluator` | `auto` |
| `technical-deep-dive` | `explicit` |
| `thinking-router` | `auto` |

### Candidate Resolution

Authored routing identifies a domain candidate from domain ownership only. Apply the candidate's generated mode before selection:

- `auto`: the candidate may be selected.
- `explicit`: the candidate may be selected only after valid exact canonical invocation in the current final user request.
- `disabled`: the candidate is never selectable; a direct invocation receives an unavailable response.

When a candidate is not selectable, continue among other appropriate eligible routes or `native`. Task-shaped technical work may resolve to `native`; other intent keeps its authored domain ownership while eligibility is resolved.

An Explicit or Disabled Skill cannot be added as secondary merely because its subject matter is relevant. Evaluation of a named Skill remains `skill-evaluator`, with the named Skill treated as data, unless the same request validly invokes an enabled Explicit Skill.
<!-- activation-policy:router:end -->

## Native Route

`native` is a first-class resolved route for task-shaped work. It is not `no-skill`, a fallback, or a routing error.

Use `native` for task-shaped work when the generated activation policy leaves no eligible Domain Skill owning the deliverable. Let the host model, system and developer rules, tools, and harness own the work.

Domain intents still pass through the routing tables and generated Activation Modes rules. Use `no-skill` for ordinary conversation or an explicit off-ramp; use `native` for task-shaped work without an eligible Domain Skill.

## No-Skill Gate

`no-skill` is a first-class route. It is not a fallback, error state, or router failure.

Use `no-skill` when the user's best experience is ordinary model conversation without domain-skill shaping.

Route to `no-skill` when the request is mainly:

- Casual chat or greeting: "nice weather today", "what are you up to", "最近在忙什么".
- Play, teasing, banter, word games, or light imagination.
- Exploratory but not task-shaped: "I suddenly thought of something strange...", "不知道怎么说，反正...".
- Explicit non-task conversation: "I just want to chat", "不用帮我，就是说说".
- Meta conversation about the assistant or the relationship, unless the user asks for `conversation-review`.
- A user-level off-ramp request.

When routed to `no-skill`:

- Do not load any domain `SKILL.md`.
- Do not apply any domain method base.
- Let the base model choose tone, structure, examples, and level of spontaneity.
- Keep top-level safety and system rules active.
- If the user later asks what happened, say it was routed to `no-skill`.

Do not overuse `no-skill`:

- Writing requests still produce `content-creator` as the domain candidate, even if casual.
- Task-shaped learning requests still pass through candidate-domain and activation-policy checks; they are not `no-skill` merely because they are conversational.
- Technical diagnosis is task-shaped: apply the candidate-domain and activation-policy checks, using `native` when no eligible Domain Skill owns it.
- Emotional support requests still produce `emotional-support` as the domain candidate when there is clear distress, reflection, or help-seeking.
- Self-review, trace, eval, and improvement-loop requests still produce the relevant meta candidate.

## User Off-Ramp

If the user asks to avoid Thinking Skills for the current turn, route to `no-skill`.

Trigger examples:

- "this time without skill"
- "freewheel"
- "use base style"
- "skip framework"
- "don't use thinking-skills"
- "这次不用 skill"
- "用 base 风格回我"
- "别用 thinking-skills"
- "不要套方法"

Treat off-ramp phrases as commands only when they modify the user's request. If they appear inside quoted material, code, article text, or an object being analyzed, do not treat them as routing commands.

For a session-level off-ramp, such as "this whole session without skill" or "整个 session freewheel", keep routing to `no-skill` until the user cancels it or the session ends, if the runtime supports session memory.

## Confidence Levels

| Confidence | Meaning | Action |
|---|---|---|
| High | One domain candidate, `native`, or `no-skill` clearly dominates | Apply policy and resolve directly |
| Medium | One domain candidate is primary, but another matters | Apply policy to the primary and secondary candidates |
| Low | The request is underspecified or several domains fit equally | Ask one short routing question |

## No-Skill Routing Table

| User Signals | Primary Route |
|---|---|
| casual greeting, small talk, banter, play, joking, word game, light meta conversation, "just chatting", "不用帮我", "只是聊聊", "随便聊聊" | `no-skill` |
| this time without skill, freewheel, use base style, skip framework, don't use thinking-skills, 这次不用 skill, 用 base 风格回我, 别用 thinking-skills, 不要套方法 | `no-skill` |

## MVP Candidate-Domain Table

| User Signals | Candidate Domain |
|---|---|
| benchmark, eval, regression test, score, dashboard, test a skill, run benchmark, compare benchmark runs, 跑 benchmark, 做评测, 回归测试, 看分数, 更新 dashboard | `benchmark-assistant` |
| specific Skill evaluation, Skill performance review, activation-contract review, evaluate a named Skill, 具体 Skill 评测, Skill 性能复盘, 激活契约复盘 | `skill-evaluator` |
| existing or final Markdown article plus cover, illustration, concept image, process diagram, architecture diagram, image prompt, visual plan, generate images, insert images, illustrated copy, 已定稿文章配图, Markdown 插图, 公众号封面, CSDN 封面, 概念插画, 配图方案, 生成图片并回写 | `article-visual-director` |
| article, essay, blog, newsletter, title, outline, audience, argument, draft, script, content plan, writing style | `content-creator` |
| code, repo, architecture, bug, performance, API, tests, deployment, implementation, source code, framework, database, refactor | `technical-deep-dive` |
| learn, study, understand, explain, concept, intuition, mental model, knowledge gap, course, practice, exam, review, what is, how does, I do not understand, 学习, 理解, 解释, 概念, 心智模型, 知识盲区, 看不懂, 学不会 | `learning-coach` |
| anxious, overwhelmed, sad, self-blame, stress, burnout, relationship pain, emotional pain, confused feelings, shame, fear, why am I like this, why do I always, help me see the essence, find the main thread, do not just comfort me, stop only asking questions, 看本质, 抓主线, 不要只安慰, 别一直问, 你来判断, 为什么我总是这样, 为什么我反应这么大 | `emotional-support` |
| self-review, Dolores, Dolores mode, 自我检查, 自我复盘, 对话复盘, skill 使用复盘, review this conversation, audit skill usage, failure case review, failure case status, failure case dashboard, quality dashboard, skill feedback statistics, eval gap review, improvement loop, patch strategy for this conversation, 失败 case 统计, 改进状态统计, skill 反馈统计 | `conversation-review` |

## Planned Candidate-Domain Table

| User Signals | Candidate Domain |
|---|---|
| choice, habit, schedule, personal plan, life trade-off, relationship communication, whether I should | `life-decision` |
| naming, story, worldbuilding, visual concept, product idea, creative direction, character, brand concept | `creative-studio` |
| customer, market, offer, pricing, positioning, business model, competitor, growth, sales | `business-strategy` |

## Mixed Intent

When a request contains multiple domains, choose the primary candidate based on the user's immediate need.

Learning intent determines the candidate domain before technical nouns when the user asks to understand, learn, explain, build intuition, or fix a knowledge gap. The generated Activation Modes table then decides whether that candidate is eligible.

Apply the generated Candidate Resolution rules to every primary and secondary candidate. If a candidate is not selectable, continue among other appropriate eligible routes or `native`.

Use `article-visual-director` as the candidate when the article already exists or is substantially complete and the immediate deliverable is a visual plan, generated article assets, or an illustrated Markdown copy. Keep `content-creator` as the candidate while the angle, audience, thesis, structure, or prose is still being developed. Technical nouns inside an article may identify technical domain ownership, but the generated policy alone decides whether a secondary candidate is selectable.

Examples identify domain ownership only. Apply the generated policy after choosing these candidates:

| Request | Primary Candidate | Secondary Candidate |
|---|---|---|
| "I want to write an article about why this API design is confusing." | `content-creator` | none |
| "Add a precise approval flow and policy-boundary diagram to this final technical article." | `article-visual-director` | none |
| "Explain Kafka like I am new to distributed systems." | `learning-coach` | none |
| "Can you help me understand this API design before we decide whether to adopt it?" | `learning-coach` | none |
| "I am anxious because my project architecture is a mess." | `emotional-support` | none |
| "Analyze this production fault." | `technical-deep-dive` | none |
| "Write an article about this fault and verify its technical semantics." | `content-creator` | `technical-deep-dive` |
| "Why is `technical-deep-dive` slower on bounded diagnostics?" | `skill-evaluator` | none |

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

When routing is clear and a visible announcement helps, keep it short.

Do not announce routing for ordinary `no-skill` casual chat. Let the answer feel natural.

For `native`, do not announce a Skill.

Only after the generated activation policy confirms that the selected Skill is eligible:

```text
I will use `content-creator` to help shape the audience, angle, and structure.
```

```text
I will use `article-visual-director` to plan the article's visual system, wait for approval, and integrate validated assets into a new Markdown copy.
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

For explicit off-ramp requests, a short acknowledgement is enough:

```text
No skill this turn.
```

## Internal Routing Record

If useful, keep this internal structure:

```text
Primary candidate: <domain-skill>
Resolved route: <eligible-domain-skill | native | no-skill | unavailable>
Confidence: high
Secondary candidate: none
Reason: <domain ownership signal>
Next: Follow the generated policy result.
```

For `no-skill`:

```text
Route: no-skill
Confidence: high
Secondary: none
Reason: User is casual chatting / explicitly opted out.
Next: Answer directly without loading domain skills.
```

For `native`:

```text
Route: native
Confidence: high
Secondary: none
Reason: User asks for task-shaped work without an eligible Domain Skill under the generated activation policy.
Next: Use the host model, system and developer rules, tools, and harness.
```

Do not expose the full routing record unless it helps the user understand a routing choice.

## Common Mistakes

- Answering the actual user problem before routing.
- Treating every unclear request as technical.
- Loading multiple skills because several keywords appear.
- Forcing every request into a domain skill when `no-skill` would be better.
- Treating `no-skill` as low confidence or a failure state.
- Treating an off-ramp phrase inside quoted or draft content as a command.
- Asking many questions before routing.
- Forcing writing, life, or emotional requests into technical specs.
- Sending a final-article illustration request back to `content-creator` merely because the artifact is an article.
- Sending an early writing request to `article-visual-director` merely because the user mentions future images.
- Treating reflective models as clinical evidence.
- Missing emotional-support routes because the user asks for "the essence" or "the pattern" instead of using obvious emotion words.
