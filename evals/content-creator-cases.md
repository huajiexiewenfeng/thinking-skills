# Content Creator Cases

Use these cases to test whether `content-creator` behaves like an editorial thinking skill rather than a generic answer generator.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| "I want to write an article about AI companionship but I do not know the angle." | Ask about intended reader or propose 2-3 angles if enough context exists |
| "Help me create an outline for a post about why debugging is emotionally hard." | Treat as content; preserve emotional nuance; create a structure |
| "Give me title options for an essay about quitting social media." | Ask for tone/audience if unclear, then provide title directions |
| "I have a technical idea but want to explain it to non-engineers." | Use technical-to-general pattern |
| "Can you help me turn this personal story into a public talk?" | Use personal reflection pattern and clarify desired audience impact |

## Negative Cases

| User Request | Should Not Do | Better Route |
|---|---|---|
| "This API keeps timing out. How do I debug it?" | Do not create an article structure | `technical-deep-dive` |
| "I feel crushed and cannot stop blaming myself." | Do not ask for article audience | `emotional-support` |
| "Should I quit my job?" | Do not make a persuasive essay outline | `life-decision` |

## Mixed Cases

| User Request | Expected Behavior |
|---|---|
| "I want to write about a painful breakup without oversharing." | Use `content-creator` with emotional-support sensitivity |
| "I want to write a blog post about our bad architecture decisions." | Use `content-creator`; carry technical context as secondary |
| "Help me make a talk from my burnout story." | Clarify audience impact and protect personal boundaries |

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
- Forces personal reflection into a rigid business framework.

