# Technical Deep Dive Cases

Use these cases to test whether `technical-deep-dive` behaves like a rigorous engineering reasoning skill rather than a generic coding helper.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| "Please use `technical-deep-dive` to investigate this Java service memory leak." | Build a debugging hypothesis tree and verification plan |
| "Please use `technical-deep-dive` to compare REST and gRPC for internal service communication." | Clarify constraints, compare trade-offs, recommend based on context |
| "Please use `technical-deep-dive` to analyze why our API latency doubled after a release." | Separate observed behavior, evidence, hypotheses, and next measurements |
| "Please use `technical-deep-dive` to review this architecture for an event-driven payment system." | Analyze boundaries, failure modes, reliability, and verification |
| "Please use `technical-deep-dive` to plan a database migration without downtime." | Provide staged migration, compatibility, rollback, and validation plan |

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

## Structured Cases

### technical-overlapping-debug-workflows-001

```yaml
id: technical-overlapping-debug-workflows-001
skill: technical-deep-dive
type:
  - MODE_MISMATCH
  - JARGON_EXPOSURE
  - OVER_OUTPUT
  - EVAL_GAP
prompt: "Please use `technical-deep-dive` to diagnose this Docker Desktop failure. The app opens to a skeleton screen and says Engine stopped after restart."
context:
  - "A host-level operational debugging workflow is already active and requires evidence before repair."
  - "The user explicitly invoked technical-deep-dive in the current request."
expected:
  - "Present one unified evidence-led debugging workflow."
  - "Move quickly to Docker-specific evidence and one discriminating test."
  - "Treat the host workflow as the procedure and technical-deep-dive as the owner of the technical artifact."
  - "Collapse any required workflow disclosure into one short opening sentence."
must_not:
  - "Expose an internal stack of overlapping skill names."
  - "Repeat intake, phases, plans, or workflow announcements already supplied by the host."
  - "Treat additional framework ceremony as proof of rigor."
quality_checks:
  - "Evidence appears before process narration."
  - "The response remains concise and task-specific."
  - "No destructive reset is proposed before root-cause evidence."
```
