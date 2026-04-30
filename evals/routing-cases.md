# Routing Cases

Use these cases to test whether `thinking-router` chooses the expected primary skill.

## Clear MVP Cases

| User Request | Expected Primary | Expected Secondary | Notes |
|---|---|---|---|
| "I want to write a blog post about AI companionship. Help me find an angle." | `content-creator` | None | Writing, audience, angle |
| "Can you help me outline an article about why people fear automation?" | `content-creator` | None | Article structure |
| "This Java service has a memory leak. How should I investigate it?" | `technical-deep-dive` | None | Technical debugging |
| "I need to compare two API designs for a payment service." | `technical-deep-dive` | None | Architecture and trade-offs |
| "I feel anxious and keep blaming myself for everything." | `emotional-support` | None | Emotional support |
| "I am overwhelmed after a conflict with my friend and do not know what I need." | `emotional-support` | None | Relationship pain and needs |

## Mixed-Intent Cases

| User Request | Expected Primary | Expected Secondary | Notes |
|---|---|---|---|
| "I want to write an article about why this API design is confusing." | `content-creator` | `technical-deep-dive` | User's output goal is writing |
| "I am panicking because our production architecture is failing." | `emotional-support` | `technical-deep-dive` | Emotional urgency first |
| "Help me turn my burnout experience into a public talk." | `content-creator` | `emotional-support` | Content output with emotional material |
| "Should I quit my job to build a SaaS product?" | `life-decision` | `business-strategy` | Planned skill, not MVP |

## Ambiguous Cases

| User Request | Expected Action | Notes |
|---|---|---|
| "I have an idea and want to sort it out." | Ask low-confidence routing question | No domain signal |
| "Help me think this through." | Ask low-confidence routing question | Underspecified |
| "I need a plan." | Ask low-confidence routing question | Could be life, technical, writing, business |

## Anti-Cases

| User Request | Incorrect Route | Correct Route | Notes |
|---|---|---|---|
| "I want to write about software architecture for non-engineers." | `technical-deep-dive` | `content-creator` | Writing goal dominates |
| "I feel stupid because I cannot fix this bug." | `technical-deep-dive` | `emotional-support` | Emotional distress dominates |
| "Give me titles for my post about debugging." | `technical-deep-dive` | `content-creator` | Title generation is content work |

