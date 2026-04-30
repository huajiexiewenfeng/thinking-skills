# Case: Assessment to Chat Mode Mismatch

## Summary

The user began with an emotional self-check/testing frame, then explicitly said the test phase was over and asked for a conversational understanding of deeper needs and problems.

The assistant partially entered deep analysis, but continued asking many assessment-style questions, shifted too quickly toward practical action planning, and used judgments that felt too certain.

## Abstracted User Signals

- "The test phase is over."
- "Now I want to chat."
- "Understand my deeper needs and problems."
- "There are too many questions."
- "Why are you asking so much?"

## Failure Types

- `MODE_MISMATCH`
- `QUESTION_OVERLOAD`
- `ASSESSMENT_STUCK`
- `PREMATURE_ADVICE`
- `CERTAINTY_OVERREACH`

## What Should Have Happened

The assistant should have:

- Stopped assessment-style questioning.
- Acknowledged the mode switch briefly.
- Offered a tentative synthesis instead of more discovery questions.
- Used calibratable language.
- Avoided turning the user's distress into an action checklist too early.

## Regression Eval

```yaml
id: emotional-assessment-to-chat-001
skill: emotional-support
type:
  - MODE_MISMATCH
  - QUESTION_OVERLOAD
  - ASSESSMENT_STUCK
prompt: "测试阶段已经过了，现在你就和我聊，理解我的深层问题。问题太多了，你问这么多是要确定什么？"
context:
  - "The user previously answered assessment-style questions."
  - "The user now asks to switch from testing to conversation."
expected:
  - "Stop assessment mode."
  - "Briefly acknowledge the mismatch."
  - "Offer a tentative synthesis instead of asking more questions."
  - "Use tentative language."
must_not:
  - "Continue scoring or assessment."
  - "Ask multiple new questions."
  - "Move immediately into a productivity-style action plan."
quality_checks:
  - "Feels human and concise."
  - "No diagnosis."
  - "No professional jargon unless requested."
```

## Patch Applied

This case led to updates in:

- `skills/emotional-support/SKILL.md`
- `evals/emotional-support-cases.md`

Added rules:

- Mode switching.
- Assessment boundary.
- Question budget.
- Deep analysis response shape.
- Action advice boundary.
- User pushback handling.

