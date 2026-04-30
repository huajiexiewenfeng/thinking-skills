# Eval Runbook

## Purpose

This runbook explains how to run the semi-automatic Thinking Skills evaluation loop.

It is intentionally lightweight: humans provide judgment, and AI agents help classify failures, draft evals, and propose minimal patches.

## When to Run

Run this process when:

- A user reports that a skill response felt wrong.
- A skill asks too many questions.
- A skill exposes too much jargon.
- The router selects the wrong skill.
- A safety boundary is missed or over-triggered.
- A skill grows large enough that refactoring may be needed.

## Inputs

Collect:

- A short summary of the failure.
- The user's feedback.
- The relevant `SKILL.md`.
- Related eval cases.
- Any abstracted case file.

Do not store raw private conversations unless the user explicitly wants that and the content is safe to keep. Prefer abstract summaries.

## Process

### 1. Create or Update an Abstract Case

Store cases under:

```text
cases/<skill-name>/<failure-pattern>.md
```

The case should include:

- Summary.
- Abstracted user signals.
- Failure types.
- What should have happened.
- Regression eval block.
- Patch history if a patch was applied.

### 2. Use `skill-evaluator`

Ask `skill-evaluator` to review:

- The failure case.
- The relevant skill.
- Existing evals.
- The failure taxonomy.

Expected output:

```markdown
## Diagnosis

Failure summary:

Failure types:

Likely source:

## Eval Gap

Existing eval coverage:

New or updated eval:

## Patch Plan

Smallest useful change:

Files likely affected:

Risks:

Recommendation:
```

### 3. Add or Update Eval Coverage

Update the relevant file in `evals/`.

For important regression cases, add a structured block:

```yaml
id: skill-failure-pattern-001
skill: skill-name
type:
  - FAILURE_TYPE
prompt: "User-like prompt"
context:
  - "Prior context if needed"
expected:
  - "Behavior that should happen"
must_not:
  - "Behavior that should not happen"
quality_checks:
  - "Subjective quality criteria"
```

### 4. Patch Minimally

Patch the smallest relevant surface:

| Failure Location | Patch Surface |
|---|---|
| Router chose wrong skill | `skills/thinking-router/SKILL.md`, `evals/routing-cases.md` |
| Correct skill, wrong submode | Domain skill and eval |
| Output too long or too technical | Domain language/output rules |
| Safety issue | Domain safety rules and `docs/safety.md` if general |
| Skill too large | Consider references only after eval coverage exists |

### 5. Review Against the Case

Before declaring the patch complete, check:

- Would the new eval catch the original failure?
- Did the patch avoid overfitting?
- Did it preserve other expected behaviors?
- Did the skill become too large or too rigid?

### 6. Record the Change

Update:

```text
CHANGELOG.md
```

If the failure is important, also update the relevant case file with:

```text
Patch Applied
```

## Status Labels

Use these labels when tracking platform or skill readiness:

| Status | Meaning |
|---|---|
| Implemented | Files exist and basic syntax/structure checks pass |
| Locally verified | Verified in the local environment or with local CLI tooling |
| Client verified | Verified inside the actual target client/runtime |
| Regression covered | A reusable eval exists for a known failure |
| Refactor candidate | The skill works but is becoming too large or complex |

## Current Example

First completed loop:

```text
cases/emotional-support/assessment-to-chat-mode-mismatch.md
cases/emotional-support/assessment-to-chat-evaluation.md
evals/emotional-support-cases.md
```

Failure types:

- `MODE_MISMATCH`
- `QUESTION_OVERLOAD`
- `ASSESSMENT_STUCK`
- `PREMATURE_ADVICE`
- `CERTAINTY_OVERREACH`

Patch:

- Added mode switching.
- Added assessment boundary.
- Added question budget.
- Strengthened deep analysis response shape.
- Added action advice boundary.
- Added user-pushback handling.

