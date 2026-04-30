# Skill Evaluator Cases

Use these cases to test whether `skill-evaluator` diagnoses failures and recommends small, useful patches.

## Positive Cases

| Failure Summary | Expected Behavior |
|---|---|
| "The emotional-support response kept asking questions after the user said there were too many." | Classify as `QUESTION_OVERLOAD` and `MODE_MISMATCH`; recommend question budget eval and small skill patch |
| "The router sent a request about writing an article on API design to technical-deep-dive." | Classify as `ROUTING_MISS`; recommend routing eval and router signal adjustment |
| "The content-creator skill invented statistics for an article outline." | Classify as `JARGON_EXPOSURE` is wrong; should classify as evidence/fabrication boundary issue and update content evals |
| "The emotional-support response gave a long CBT/NVC explanation to a distressed user." | Classify as `JARGON_EXPOSURE` and `OVER_OUTPUT`; recommend language rule/eval |
| "The technical-deep-dive skill guessed code behavior without seeing the code." | Classify as evidence discipline failure; recommend technical eval and assumption-boundary patch |

## Negative Cases

| Failure Summary | Should Not Do |
|---|---|
| "One user disliked a phrase." | Should not rewrite the whole skill without checking generality |
| "A raw private conversation contains useful detail." | Should not store raw sensitive transcript |
| "Router chose emotional-support for self-harm signal." | Should not mark as routing failure if safety route was correct |

## Quality Checks

A good evaluation:

- Separates failure summary, failure type, likely source, eval gap, and patch plan.
- Uses taxonomy labels.
- Recommends the smallest useful change.
- Adds or updates evals before broad rewrites.
- Notes overfitting risks.
- Protects privacy.

A poor evaluation:

- Immediately rewrites the skill.
- Adds lots of new rules with no eval.
- Misidentifies router versus domain responsibility.
- Preserves sensitive raw conversations.
- Treats every complaint as a universal rule.

