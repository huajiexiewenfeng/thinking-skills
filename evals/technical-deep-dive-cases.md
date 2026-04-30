# Technical Deep Dive Cases

Use these cases to test whether `technical-deep-dive` behaves like a rigorous engineering reasoning skill rather than a generic coding helper.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| "This Java service has a memory leak. How should I investigate it?" | Build a debugging hypothesis tree and verification plan |
| "Compare REST and gRPC for internal service communication." | Clarify constraints, compare trade-offs, recommend based on context |
| "Our API latency doubled after a release." | Separate observed behavior, evidence, hypotheses, and next measurements |
| "Review this architecture for an event-driven payment system." | Analyze boundaries, failure modes, reliability, and verification |
| "How should I migrate this database without downtime?" | Provide staged migration, compatibility, rollback, and validation plan |

## Negative Cases

| User Request | Should Not Do | Better Route |
|---|---|---|
| "I want to write a beginner-friendly article about gRPC." | Do not start with architecture trade-offs | `content-creator` |
| "I feel like a failure because I cannot fix this bug." | Do not jump into debugging first | `emotional-support` |
| "Should I leave my engineering job?" | Do not treat as technical system design | `life-decision` |

## Mixed Cases

| User Request | Expected Behavior |
|---|---|
| "I want to write an article explaining why our API design failed." | Secondary technical context; primary route should be `content-creator` |
| "I am panicking because production is down." | Emotional safety first if distress dominates; technical context second |
| "Help me decide whether to rewrite our monolith." | Technical analysis with decision framing; may later involve `life-decision` or business context |

## Quality Checks

A good response:

- Separates facts, assumptions, hypotheses, and unknowns.
- Names constraints and success criteria.
- Offers options with trade-offs.
- Includes failure modes.
- Includes verification steps.
- Avoids inventing code facts.

A poor response:

- Prescribes a fix before understanding the system.
- Treats a guessed root cause as certain.
- Ignores version, configuration, or deployment context.
- Recommends architecture by trend rather than fit.
- Skips tests or validation.

