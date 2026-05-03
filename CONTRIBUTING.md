# Contributing

Thank you for helping improve Thinking Skills.

This project is an independent, domain-neutral thinking framework. Contributions should preserve that identity.

## Contribution Principles

- Do not make software development the default domain.
- Keep `thinking-router` small and focused on routing.
- Give every domain skill its own worldview.
- Declare method bases explicitly.
- Add eval cases for new or changed behavior.
- Be honest about evidence, uncertainty, and safety boundaries.

## Adding a New Skill

Before adding a skill:

1. Confirm it represents a distinct thinking mode.
2. Check whether it belongs as a new skill or as a method inside an existing skill.
3. Define its method bases.
4. Add routing signals.
5. Add eval cases.

Required files:

```text
skills/<skill-name>/SKILL.md
evals/<skill-name>-cases.md
```

For Alpha-stage contributions, keep the bar simple. A useful skill PR should include:

- A focused `SKILL.md`.
- Clear "when to use" and "when not to use" boundaries.
- At least 3 eval cases.
- Safety boundaries when the domain is high-stakes.
- A short note explaining why this is a distinct thinking mode rather than a method inside an existing skill.

Also update:

```text
README.md
docs/roadmap.md
docs/routing.md
docs/method-bases.md
```

## What Not to Contribute

Some skills may be useful as personal local skills but should not enter the shared repository.

Local design drafts, article drafts, and Superpowers-style planning/spec files are intentionally not part of the shared repository. Keep these files local:

```text
articles/
docs/superpowers/
benchmark-runs/local-*.json
docs/assets/thinking-skills-superpowers-*.png
```

Do not commit these paths unless the project explicitly decides to publish a cleaned, public-facing version.

Please do not submit skills that:

- Replace medical, legal, financial, or mental-health professionals.
- Include raw private conversations or identifying personal details.
- Depend on unverifiable metaphysical claims as authority.
- Encode a single company's private workflow without abstraction.
- Duplicate an existing skill without a clear difference in when to use it.
- Are only a bundle of prompt preferences rather than a reusable thinking mode.

## Editing an Existing Skill

When editing a skill:

- Preserve its domain boundary.
- Avoid adding unrelated responsibilities.
- Update eval cases when behavior changes.
- Keep description focused on when to use the skill, not how it works.
- Keep safety language clear and practical.

## Skill Review Checklist

- Name uses lowercase hyphenated words.
- Frontmatter includes `name` and `description`.
- Description starts with "Use when".
- Method bases are declared.
- "When not to use" is clear.
- Output types match the domain.
- Safety boundaries are present when relevant.
- Eval cases include positive, negative, and mixed examples.

## Relationship to Superpowers

Thinking Skills may borrow useful structural ideas from skill-based workflows such as Superpowers, but it is not a Superpowers fork or plugin.

If you copy or adapt substantial text from another project, preserve the appropriate license notice and update `ATTRIBUTION.md`.
