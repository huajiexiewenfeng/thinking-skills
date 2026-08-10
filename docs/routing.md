# Routing

## Router Responsibility

`thinking-router` is the entry point for Thinking Skills.

It has one job: classify the user's request and select exactly one primary route: a Domain Skill, `native`, or `no-skill`.

It must not answer the substantive question.

## Routing Flow

```text
User request
  -> run the no-skill gate
  -> identify intent signals
  -> choose one primary route: Domain Skill, native, or no-skill
  -> optionally choose one secondary Domain Skill when explicitly justified
  -> if confidence is low, ask one short routing question
```

## Activation Policy

Activation is a framework-level concern configured in `config/activation-policy.yaml`; it is not a mode list maintained by the Router. Under the shipped policy, ordinary technical and learning work resolves to `native`. `technical-deep-dive` and `learning-coach` require valid exact invocation of their canonical identifier in the current user request, while every other current first-party Skill remains Auto.

Disabled requires platform enforcement; a Skill self-guard alone is insufficient. Cursor and OpenCode source-mode installs fail closed when Disabled Skills are configured because an unfiltered source directory cannot enforce that state. Users are not asked to configure modes. Route output and repository checks are declared-policy evidence; actual Skill loading requires a trusted host trace.

## Confidence Levels

| Confidence | Meaning | Action |
|---|---|---|
| High | One Domain Skill, `native`, or `no-skill` clearly dominates | Route directly |
| Medium | One route is primary, but another domain matters | Route to the primary and note secondary context |
| Low | Several domains fit or the request is underspecified | Ask one short routing question |

## MVP Routing Table

| Signals | Primary Route |
|---|---|
| existing or final Markdown article, article cover, section illustration, visual plan, image prompt, process diagram, architecture diagram, insert images, illustrated copy, 已定稿文章配图, 公众号封面, CSDN 封面, 概念插画, 生成并回写 Markdown | `article-visual-director` |
| article, essay, blog, newsletter, title, outline, audience, argument, draft, script, content structure | `content-creator` |
| code, repo, architecture, bug, performance, API, tests, deployment, implementation, source, framework, database | `native` |
| learn, study, understand, explain, concept, intuition, mental model, knowledge gap, course, practice, exam, review, what is, how does | `native` |
| anxious, overwhelmed, sad, self-blame, relationship pain, stress, burnout, confused feelings, emotional pain | `emotional-support` |
| self-review, Dolores, conversation review, skill trace, failure case, eval gap, improvement loop, 自我检查, 自我复盘, 对话复盘 | `conversation-review` |

## Planned Routing Table

| Signals | Primary Skill |
|---|---|
| choice, habit, schedule, personal plan, relationship communication, life trade-off | `life-decision` |
| naming, story, worldbuilding, visual concept, product idea, creative direction | `creative-studio` |
| market, positioning, offer, pricing, customer, strategy, business model | `business-strategy` |

## Mixed-Intent Examples

Learning intent remains the candidate domain when the user asks to understand, learn, explain, build intuition, or fix a knowledge gap. Under the shipped Explicit policy for `learning-coach`, ordinary learning intent nevertheless resolves to `native`; technical nouns do not change that result.

Ordinary task-shaped technical requests also use the host-native route. `technical-deep-dive` and `learning-coach` are available only when the current user request validly and exactly invokes the relevant canonical identifier. Subject matter, requests for deep or systematic treatment, mere mention, another component's handoff, and prior-request invocation do not activate either Skill.

`native` owns task-shaped technical work such as diagnosis, architecture, implementation, source-level reasoning, debugging, performance analysis, and verification without loading a Thinking Skills Domain Skill. `no-skill` owns ordinary conversation and explicit off-ramps; it is not the route for a technical deliverable. A valid TDD invocation applies only to the current request.

Use `article-visual-director` after the article exists or is substantially complete and the requested deliverable is its visual system or an illustrated Markdown copy. Keep `content-creator` primary when the angle, audience, thesis, outline, or prose still needs development. Technical architecture nouns may provide secondary context, but they do not displace the visual-director route when the immediate artifact is an article visual.

| User Request | Route |
|---|---|
| "I want to write an article about why this API design is confusing." | Primary: `content-creator`; Secondary: none |
| "This Markdown article is final. Plan a cover, concept illustrations, and any necessary architecture diagram, then insert approved assets into a new copy." | Primary: `article-visual-director`; Secondary: none |
| "The article is final, but the Gateway-to-Runtime direction is not verified. Plan the illustration without inventing edges." | Primary: `article-visual-director`; Secondary: none |
| "I only have an article idea; help me choose the angle before we think about illustrations." | Primary: `content-creator`; Secondary: none |
| "Explain vector databases to me. I know normal databases but not this." | Primary: `native`; Secondary: none |
| "Explain Kafka like I am new to distributed systems." | Primary: `native`; Secondary: none |
| "Can you help me understand this API design before we decide whether to adopt it?" | Primary: `native`; Secondary: none |
| "$thinking-skills:learning-coach Help me build a mental model of vector databases." | Primary: `learning-coach`; Secondary: none |
| "Diagnose why this API times out under load." | Primary: `native`; Secondary: none |
| "$thinking-skills:technical-deep-dive Analyze this production fault." | Primary: `technical-deep-dive`; Secondary: none |
| "Use `content-creator` to write the article and invoke `$thinking-skills:technical-deep-dive` to verify its technical semantics." | Primary: `content-creator`; Secondary: `technical-deep-dive` |
| "I am anxious because my project architecture is a mess." | Primary: `emotional-support`; Secondary: none |
| "Help me decide whether to quit my job and build a startup." | Primary: `life-decision`; Secondary: `business-strategy` |
| "Do a self-review of this conversation and find any eval gaps." | Primary: `conversation-review`; Secondary: `skill-evaluator` |
| "Summarize what we discussed." | Primary: `no-skill`; Secondary: none |

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
- Do not select `technical-deep-dive` from topic, depth wording, mention, handoff, or prior-request invocation.
- Do not select `learning-coach` from ordinary learning intent, mention, handoff, or prior-request invocation.
