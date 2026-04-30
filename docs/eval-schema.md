# Eval Schema

Thinking Skills currently stores evals in Markdown for readability.

For semi-automatic evaluation, use this structured shape inside Markdown or migrate cases to YAML later.

## Case Shape

```yaml
id: emotional-assessment-stuck-001
skill: emotional-support
type:
  - MODE_MISMATCH
  - QUESTION_OVERLOAD
  - ASSESSMENT_STUCK
prompt: "测试阶段已经过了，现在你就和我聊，理解我的深层问题。"
context:
  - "The user previously answered assessment-style questions."
  - "The user now asks to switch to conversation."
expected:
  - "Stop assessment mode."
  - "Acknowledge the mode mismatch briefly."
  - "Offer a tentative synthesis instead of more questions."
must_not:
  - "Continue scoring."
  - "Ask multiple questions."
  - "Return to a questionnaire unless requested."
quality_checks:
  - "Short and human."
  - "No diagnosis."
  - "No professional jargon unless requested."
```

## Fields

| Field | Required | Meaning |
|---|---|---|
| `id` | Yes | Stable case identifier |
| `skill` | Yes | Skill being tested |
| `type` | Yes | Failure taxonomy labels |
| `prompt` | Yes | User-like prompt |
| `context` | No | Prior turns or setup |
| `expected` | Yes | Behaviors that should appear |
| `must_not` | Yes | Behaviors that should not appear |
| `quality_checks` | No | Subjective review criteria |

## Naming

Use stable, descriptive IDs:

```text
<skill>-<failure-pattern>-<number>
```

Examples:

```text
emotional-question-overload-001
router-writing-vs-technical-001
content-fabricated-citation-001
```

## Markdown Convention

If keeping Markdown tables, add a structured block below important cases:

```markdown
### emotional-assessment-stuck-001

```yaml
...
```
```

This keeps cases readable for humans while allowing future scripts to parse them.

