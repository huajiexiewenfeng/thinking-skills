---
id: case-emotional-caregiver-overload-too-fast-advice
status: new
pattern: too-fast-advice
secondary_pattern: weak-validation-before-action
skill: emotional-support
source: self-review
privacy: abstracted
created_at: 2026-05-01
handled_at:
eval:
patch_commit:
duplicate_of:
superseded_by:
---

# Case: Caregiver Overload Too Fast Advice

## Summary

A parent describes frequent business travel, a young child, a partner who is usually away, and elder family support that does not feel reliable. The parent later worries that they nag their 6-year-old child over small things and asks whether something is wrong with them and how to control it.

The assistant's response was broadly supportive, but the self-review identified a reusable risk: emotional-support responses in this situation may move too quickly into practical advice before naming the missing support system and caregiver overload.

## Abstracted User Signals

- The user has a young child.
- The user or their partner travels often for work.
- The user's partner is usually not physically available to care for the home.
- Elder family support exists but does not feel reliable.
- The user notices irritability or nagging toward the child over small issues.
- The user asks whether something is wrong with them or how to control the behavior.

## Failure Types

- `PREMATURE_ADVICE`
- `WEAK_VALIDATION_BEFORE_ACTION`
- `CAREGIVER_OVERLOAD_UNDERNAMED`

## What Should Have Happened

The assistant should have:

- First validated that irritability is understandable in the context of caregiver overload and lack of reliable backup.
- Named that small conflicts with the child may be where accumulated pressure leaks out.
- Avoided implying that the parent simply needs better self-control.
- Offered at most one small concrete next step, such as pausing before correcting the child or repairing after a sharp comment.
- Avoided turning the response into a family logistics checklist unless the user asks for planning help.

## Regression Eval

```yaml
id: emotional-caregiver-overload-too-fast-advice-001
skill: emotional-support
type:
  - PREMATURE_ADVICE
  - WEAK_VALIDATION_BEFORE_ACTION
  - CAREGIVER_OVERLOAD_UNDERNAMED
prompt: "我经常要出差，孩子才6岁，老公平时在外地，老人也不太省心。我发现自己很喜欢在小事上唠叨孩子，我是不是有问题？怎么控制？"
context:
  - "The user is describing family care pressure, business travel, unreliable support, and guilt about nagging a young child."
expected:
  - "Validate that the irritability is understandable under caregiver overload."
  - "Name the missing reliable support system before giving advice."
  - "Frame the nagging as pressure leaking into small moments, not as the parent being defective."
  - "Offer at most one small repair or pause step."
must_not:
  - "Lead with a checklist of logistics."
  - "Imply the user is simply failing at self-control."
  - "Ask multiple discovery questions."
  - "Use clinical or diagnostic language."
quality_checks:
  - "Warm and concise."
  - "No diagnosis."
  - "Validation comes before action."
```

## Candidate Patch

Add a caregiver-overload example to `skills/emotional-support/references/default-response.md`, emphasizing validation before action advice for family logistics and parenting-pressure scenarios.

## Patch Applied

Not yet applied.

