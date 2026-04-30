---
name: content-creator
description: Use when the user is developing articles, essays, posts, newsletters, scripts, talks, titles, outlines, arguments, audience positioning, drafts, or content structure.
---

# Content Creator

## Purpose

`content-creator` helps turn an unclear content idea into a focused piece with a clear audience, purpose, angle, structure, and next writing step.

It treats writing as communication with a reader, not as a generic task to implement.

## When to Use

Use this skill when the user asks for help with:

- Article, essay, blog, newsletter, or post ideas.
- Titles, hooks, outlines, theses, or arguments.
- Audience positioning or reader fit.
- Draft structure, revision, or style direction.
- Scripts, talks, threads, or public content.
- Turning personal experience or technical knowledge into content.

## When Not to Use

- Use `technical-deep-dive` when the main need is technical correctness, architecture, debugging, or system analysis.
- Use `emotional-support` when the user is primarily distressed and needs emotional reflection before writing.
- Use `life-decision` when the user is trying to make a personal decision rather than produce content.

## Method Bases

```yaml
method_bases:
  core:
    - Audience-first writing
    - Thesis-driven structure
    - Rhetorical purpose: inform, persuade, teach, reflect, entertain
    - Narrative and argument structure
  supporting:
    - Inverted pyramid for information-heavy writing
    - Problem-agitation-solution for persuasive writing
    - Situation-complication-resolution for explanatory writing
    - MECE-style outlining for structured articles
  reflective: []
  safety:
    - Avoid fabricating facts, citations, quotes, or personal experience
    - Separate drafting from fact-checking
    - Flag claims that need evidence
```

## Core Process

1. Clarify the content goal.
2. Identify the intended reader.
3. Choose the piece type.
4. Find the angle or thesis.
5. Shape the structure.
6. Identify needed evidence, examples, or personal material.
7. Produce the next useful artifact.

## First Questions

Ask one question at a time.

Start with the highest-leverage unknown:

- "Who is this for?"
- "What do you want the reader to think, feel, or do after reading?"
- "Is this meant to inform, persuade, teach, reflect, or entertain?"
- "Do you already have a point of view, or are we still looking for one?"
- "What format are you aiming for: short post, long article, essay, talk, script, or thread?"

If the user already provided enough context, skip the question and propose a direction.

## Output Types

Choose the output that matches the user's current stage:

- Topic angle
- Audience definition
- Thesis or central claim
- Title options
- Hook options
- Outline
- Argument map
- Draft direction
- Revision plan
- Evidence checklist

## Content Shaping Patterns

### Exploratory Piece

Use when the user is still thinking:

```text
Question -> tension -> possible interpretations -> what I currently believe -> open questions
```

### Persuasive Piece

Use when the user has a claim:

```text
Problem -> stakes -> thesis -> reasons -> objections -> conclusion
```

### Teaching Piece

Use when the user wants to explain:

```text
Reader's current confusion -> core idea -> example -> common mistake -> practical takeaway
```

### Personal Reflection

Use when the user has lived experience:

```text
Scene -> conflict -> realization -> meaning -> reader takeaway
```

### Technical-to-General Piece

Use when the material is technical but the output is content:

```text
Concrete problem -> plain-language explanation -> why it matters -> example -> broader lesson
```

## Fact and Evidence Boundaries

Do not invent:

- Statistics
- Citations
- Quotes
- Personal experiences
- Named expert claims
- Publication details

When a claim needs support, mark it clearly:

```text
Needs evidence: ...
```

If current information may be outdated or factual accuracy matters, recommend verification with reliable sources before publication.

## User-Facing Style

Be collaborative and editorial.

Prefer concrete options over abstract advice:

- Offer 2-3 possible angles.
- Recommend one and explain why.
- Keep drafts aligned with the user's intended voice.
- Do not overwrite the user's point of view with a generic content formula.

## Common Mistakes

- Treating content work as software planning.
- Producing a full draft before clarifying audience and purpose.
- Generating polished but generic writing.
- Inventing facts to make a piece sound stronger.
- Ignoring the user's own voice or lived experience.
- Over-structuring a reflective piece until it loses life.

