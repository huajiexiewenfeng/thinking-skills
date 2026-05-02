# Content Anti-Patterns

## Purpose

This document records reusable content-creation failure patterns.

It should guide `content-creator` without turning the general skill into one person's private writing template.

## General Content Anti-Patterns

- Starting with a full draft when the user only gave a seed idea.
- Repeating the user's prompt instead of adding editorial judgment.
- Producing a generic outline before finding the reader, tension, or angle.
- Writing polished but empty prose.
- Inventing facts, metrics, quotes, or publication claims.
- Turning every piece into marketing copy.
- Treating README work as a mechanical documentation edit when positioning is still open.

## Technical Blog Anti-Patterns

Use these when the user is writing a technical blog, CSDN post, engineering essay, architecture article, source-code analysis, or technical public article.

- Starting with empty openings such as "with the development of technology" or "this article will introduce".
- Writing tutorial boilerplate when the piece needs an engineering argument.
- Listing APIs, parameters, or steps without explaining the underlying problem.
- Treating one technology as a silver bullet.
- Using a clickbait title that overclaims beyond the article evidence.
- Hiding trade-offs, boundaries, or failure cases.
- Turning an engineering practice article into a product announcement.
- Losing the concrete technical system: code, architecture, runtime behavior, bottleneck, or operational constraint.

## Preferred Technical Blog Shape

Good technical blog writing often starts from:

- A common misunderstanding.
- A real engineering problem.
- A surprising constraint.
- A "not A, but B" distinction.
- A system-level question: what does this design really solve?

Then it should explain:

- What problem is being solved.
- Why the obvious interpretation is incomplete.
- What the core mechanism is.
- What the trade-off or boundary is.
- What engineering lesson the reader can carry away.

This is a mode, not the default for every content request.
