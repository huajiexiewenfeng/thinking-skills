# Skill Feedback

This directory stores lightweight feedback about skill usage. It complements failure cases without requiring every feedback note to match a specific case.

## Scope

Feedback is tracked at the skill level, not the case level.

Use feedback records to answer:

- Which skills are working well in real conversations?
- Which skills repeatedly produce mixed or unsatisfied outcomes?
- Which contexts should become new failure cases or evals?

Do not treat silence as success. Record feedback when the user gives an explicit signal, or when the assistant proposes a candidate and the user confirms it.

## Judgment Values

```yaml
satisfied
mixed
unsatisfied
```

Use `mixed` when the user response is positive but self-review finds a reusable improvement opportunity.

## User Signal Values

```yaml
explicit_positive
explicit_negative
explicit_mixed
confirmed_ai_judgment
```

Do not write implicit feedback without confirmation.

## Confidence Values

```yaml
low
medium
high
```

## File Format

Create one Markdown file per skill:

```text
feedback/<skill-name>.md
```

Each file should use this table:

```markdown
| Date | Judgment | User Signal | Confidence | Context | Related Case | Notes |
|---|---|---|---|---|---|---|
```

`Related Case` can be blank when feedback is skill-level only.

