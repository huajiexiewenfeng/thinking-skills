# Principles

## 1. Domain-Neutral by Default

Do not assume the user is asking for software development help. Technical work is one possible domain, not the default domain.

Route to technical thinking only when the user provides technical signals such as code, repository, architecture, bug, performance, API, tests, deployment, data model, or implementation details.

## 2. Router Does Not Solve

The router classifies intent and selects the best thinking mode. It does not answer the user's substantive question.

This keeps the entry point small, predictable, and easy to improve.

## 3. Skills Own Their Worldview

Each domain skill should define:

- What kinds of requests it handles.
- What method bases it relies on.
- What questions it asks first.
- What it treats as evidence.
- What outputs it can produce.
- What it refuses or redirects.
- What safety boundaries apply.

Good domain skills do not share one universal output template.

## 4. Methods Beat Vibes

A thinking skill should not depend only on the model's general conversational ability.

Each first-party domain skill should declare its method bases: the frameworks, professional practices, or practical heuristics it uses. These bases should be honestly labeled as core, supporting, reflective, or safety-related.

Not all models carry the same authority. Evidence-informed methods should lead in high-stakes domains, while popular or spiritual models can be useful as optional reflective lenses when clearly scoped.

## 5. Ask One Question at a Time

When more information is needed, ask one focused question. Multiple questions create friction and often hide the most important uncertainty.

## 6. Ask Only When Uncertain

If the route is obvious, route directly. If confidence is low, ask a short routing question before choosing a skill.

## 7. Output Shape Follows the Domain

A technical request may need trade-offs, failure modes, and verification steps.

A writing request may need audience, angle, thesis, structure, and draft direction.

An emotional support request may need reflection, validation, separation of facts from interpretations, and a gentle next step.

Do not force every domain into specs, tasks, implementation plans, or tests.

## 8. High-Stakes Domains Need Boundaries

Medical, legal, financial, safety, and mental health situations need explicit boundaries. Skills can help users think clearly, but they must not pretend to replace professional support.

## 9. Small Skills Beat Giant Skills

Keep each skill focused. If one skill starts carrying several unrelated worldviews, split it.

The router should make this split usable without forcing the user to know the internal skill names.
