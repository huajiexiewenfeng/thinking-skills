# Skill Evaluator Diagnosis: Assessment to Chat Mode Mismatch

## Diagnosis

Failure summary:

The user moved from an assessment/self-check frame into a request for conversation and deeper understanding. The assistant did not switch modes cleanly: it continued asking assessment-style questions, did not synthesize early enough, used overly certain judgments, and moved toward practical action planning before the emotional structure was sufficiently understood.

Failure types:

- `MODE_MISMATCH`
- `QUESTION_OVERLOAD`
- `ASSESSMENT_STUCK`
- `PREMATURE_ADVICE`
- `CERTAINTY_OVERREACH`

Likely source:

- Domain skill: `emotional-support`
- Eval gap: existing evals did not strongly test mode switching from assessment to conversation
- Documentation gap: the skill did not previously define assessment boundaries or question budget clearly enough

## Eval Gap

Existing eval coverage:

`evals/emotional-support-cases.md` had general deep analysis and question-overload cases, but did not explicitly model an assessment-to-conversation transition.

New or updated eval:

Add a structured case for:

```text
The user says the testing phase is over and complains that the assistant is asking too many questions.
```

The eval should require:

- Stop assessment mode.
- Acknowledge the mismatch briefly.
- Offer a tentative synthesis.
- Ask at most one calibration question only if useful.

The eval should forbid:

- Continuing scoring.
- Asking multiple questions.
- Jumping into a productivity task list.

## Patch Plan

Smallest useful change:

Add mode switching, assessment boundary, question budget, deep-analysis response shape, action-advice boundary, and user-pushback handling to `emotional-support`.

Files likely affected:

- `skills/emotional-support/SKILL.md`
- `evals/emotional-support-cases.md`
- `cases/emotional-support/assessment-to-chat-mode-mismatch.md`

Risks:

- The skill may become too large and harder for agents to follow.
- Too many rules may make responses feel constrained.
- The case may overfit to one user's emotional-support preference if not balanced with other evals.

Recommendation:

Keep the current patch, but treat it as a signal that `emotional-support` should later be split into references after eval coverage improves. Do not split immediately. First add structured eval coverage and run more examples through the skill.

