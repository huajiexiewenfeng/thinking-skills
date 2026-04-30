# Failure Taxonomy

Use this taxonomy to classify failures before changing a skill.

## Failure Types

| Code | Type | Meaning |
|---|---|---|
| `ROUTING_MISS` | Wrong skill selected | Router sent the request to the wrong domain |
| `MODE_MISMATCH` | Wrong mode inside the right skill | The skill was right, but it used the wrong submode |
| `QUESTION_OVERLOAD` | Too many questions | The response felt like an interview or audit |
| `JARGON_EXPOSURE` | Too much professional language | The skill exposed method bases instead of using them internally |
| `OVER_OUTPUT` | Too much content | The response was too long for the user's state |
| `PREMATURE_ADVICE` | Advice too early | The response jumped to action before understanding |
| `CERTAINTY_OVERREACH` | Too certain | The response presented guesses as conclusions |
| `ASSESSMENT_STUCK` | Stuck in assessment | The response kept testing/scoring after the user wanted conversation |
| `SAFETY_MISS` | Safety boundary missed | Risk signals did not trigger safety behavior |
| `SAFETY_OVERREACH` | Safety response too strong | The response escalated when no safety risk was present |
| `VOICE_MISMATCH` | Wrong tone | The response did not fit the user's desired tone or context |
| `EVAL_GAP` | Missing regression case | There is no eval that would catch the failure |
| `DOC_OVERLOAD` | Skill too heavy | The skill document is too large or repetitive for reliable use |

## Diagnosis Questions

1. Did the router choose the right primary skill?
2. Did the selected skill choose the right mode?
3. Did the response fit the user's current state?
4. Did it ask more than needed?
5. Did it expose frameworks that should have stayed internal?
6. Did it overstate certainty?
7. Did it move too quickly into advice?
8. Did safety boundaries activate correctly?
9. Would an existing eval catch this?
10. What is the smallest patch that would help?

## Patch Mapping

| Failure Type | Likely Patch |
|---|---|
| `ROUTING_MISS` | Update router signals and routing evals |
| `MODE_MISMATCH` | Add mode switching rule or mode-specific eval |
| `QUESTION_OVERLOAD` | Add question budget or repair behavior |
| `JARGON_EXPOSURE` | Add language rule and negative eval |
| `OVER_OUTPUT` | Add response length target |
| `PREMATURE_ADVICE` | Add action advice boundary |
| `CERTAINTY_OVERREACH` | Add tentative language rule |
| `ASSESSMENT_STUCK` | Add assessment boundary |
| `SAFETY_MISS` | Add safety trigger and safety eval |
| `SAFETY_OVERREACH` | Clarify safety threshold |
| `VOICE_MISMATCH` | Add tone rule and examples |
| `EVAL_GAP` | Add eval case first |
| `DOC_OVERLOAD` | Move submodes into references |

