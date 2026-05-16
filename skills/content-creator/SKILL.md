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

## Collaborative Writing Flow

For multi-turn writing work, behave like an editor helping a piece take shape over time.

1. Capture the user's seed idea.
2. Detect the current content stage.
3. Ask one highest-leverage question only if needed.
4. Synthesize what is already known before adding new structure.
5. Offer 2-3 possible angles, structures, or positioning choices when the direction is still open.
6. Recommend one direction and briefly explain why.
7. Ask for confirmation before expanding into a full outline or full draft.
8. Preserve decisions the user has accepted in later turns.
9. Move toward the next useful artifact instead of restarting the discovery process.

Do not treat every turn as a fresh writing request. Carry forward the agreed reader, thesis, tone, format, and constraints unless the user revises them.

### Pre-Draft Title Gate

Before drafting a full article, long post, newsletter, CSDN article, or WeChat official account article, discuss titles with the user first unless the user has already approved a title in this conversation or explicitly asks to skip title discussion.

Produce about 5 title options by default, covering distinct positioning angles:

- Traffic / curiosity: stronger reader pull, but no false promise.
- Technical credibility: precise, searchable, and credible for technical readers.
- Contrarian / tension: challenges a common misunderstanding.
- Beginner-friendly: clear, low-barrier, and easy to understand.
- Long-tail / evergreen: stable search value and reusable concept framing.

For each title, add a short note about its angle and trade-off. Recommend one title and explain why in 1-2 sentences.

Do not draft the full article until the user chooses a title, accepts the recommendation, or explicitly says to continue without deciding. If the user asks for a draft with a title already provided, briefly confirm whether to use that title or offer quick alternatives before expanding.

### Initial Idea Gate

When the user brings an early article, essay, post, or talk idea and has not approved an angle or outline yet, do not write a full draft first.

Produce a compact content design instead:

- The likely reader or audience if it can be inferred.
- The core tension or question in the idea.
- 2-3 possible angles or positioning choices.
- One recommended angle and why.
- One confirmation question before moving to a full outline or full draft.

This gate applies even when the user provides a vivid seed paragraph. A seed paragraph is raw material, not approval to lock the thesis.

## Content Stage Detection

Identify the current stage and respond accordingly:

- Idea stage: find reader, tension, angle, and possible thesis.
- Positioning stage: decide audience, purpose, point of view, and desired effect.
- Structuring stage: create outline, argument map, section flow, or evidence plan.
- Drafting stage: write a section, intro, full draft, or sample passage.
- Revision stage: improve clarity, rhythm, structure, voice, and reader fit.
- Publishing stage: refine title, hook, summary, platform fit, and call to action.

If the stage is obvious from the user's request, proceed without asking.

## Platform Adaptation Modes

Use these modes when the user names a target platform or audience whose reading expectations change the shape of the piece. Platform adaptation is not only tone adaptation; it may require different evidence, pacing, structure, and reader artifacts.

### Technical Platform Mode

Use when drafting or adapting for CSDN, developer blogs, engineering newsletters, technical communities, or technical knowledge platforms.

Goal: transform the reading shape for technical readers, not merely make the tone more technical or shorten the article.

When both Technical Blog Mode and Technical Platform Mode apply, use Technical Blog Mode to find the engineering tension, then use Technical Platform Mode to adapt the final reading shape for the target platform.

Prefer:

- Open with a concrete developer scenario, technical problem, or workflow tension.
- Consider comparison tables for abstract distinctions.
- Add workflows or checklists when they clarify the reader's next action.
- Use Mermaid diagrams for process-oriented content, such as request flow, lifecycle, routing, evaluation loops, failure handling, or deployment steps.
- Include small cases or examples grounded in developer work.
- Use code, pseudo-code, commands, file trees, diagrams, or configuration snippets only when they clarify the point.
- For CSDN-style articles, use fenced code blocks only for code, configuration, commands, logs, protocol payloads, stack traces, SQL, Mermaid diagrams, or content whose spacing and formatting are semantically important.
- For conceptual material, prefer paragraphs, bullet lists, tables, blockquotes, and inline code instead of `text` code fences.
- When drafting CSDN article body text, treat `text` fenced code blocks as prohibited for ordinary concepts, thesis statements, comparison phrases, workflow summaries, conclusion lines, and conceptual formulas. Use prose, lists, tables, blockquotes, inline code, or Mermaid diagrams instead.
- Preserve the full argument when the user wants a long-form platform version; technical adaptation does not imply summarization.

Avoid:

- Producing a continuous speech-like essay with only claims and explanations.
- Treating a technical-platform version as a shorter version by default.
- Adding code or technical artifacts mechanically when the article is conceptual.
- Adding Mermaid diagrams mechanically when the process is not actually important.
- Using `text` code fences for ordinary claims, concept lists, question lists, conclusions, or short explanatory phrases in CSDN-style articles.
- Copying internal shape templates into the user-facing article as `text` code fences.
- Dropping important argument layers just because the target platform is technical.

Useful default shape for CSDN-style conceptual articles:

1. Concrete developer scenario.
2. Core tension or problem.
3. Main thesis.
4. Comparison table.
5. Practical example or workflow.
6. Checklist readers can apply.
7. Broader implication.
8. Short actionable conclusion.

Do not use Technical Platform Mode just because the topic mentions technology. Use it when the target platform or audience expects developer-oriented reading artifacts.

### WeChat Mobile Publishing Mode

Use when drafting, revising, or preparing content for WeChat Official Account articles, WeChat Moments long-form sharing, or other phone-first Chinese reading environments. Trigger this mode when the user mentions 微信公众号, 公众号, 手机端阅读, 微信排版, 发朋友圈, 配图, 发布, or when a Chinese technical article is clearly being prepared for mobile publication.

Goal: preserve the article's argument while making it stable, readable, and visually comfortable on mobile. This is a publishing and layout adaptation mode, not just a tone adjustment.

Prefer:

- Use short natural paragraphs, usually 1-3 sentences per paragraph.
- Keep enough whitespace through paragraph breaks and section headings, not through raw HTML such as `<br/>`.
- Use bullet lists for compact two-column-like information. Prefer `- **Term**: explanation` over Markdown tables when the content must survive mobile rendering.
- Use numbered steps for sequences, workflows, or staged evolution.
- Use bold sparingly for key conclusions, reusable phrases, and section-level takeaways.
- Put one or two strong memorable lines in the piece, then let the rest of the argument read naturally.
- For technical terms, keep established English terms when they are the real concept anchor, such as `Base Model`, `Agent Runtime`, `RAG`, `Trace`, `Eval`, or `Human Approval`; use Chinese for surrounding explanation and reader-facing labels.
- Plan images by role: one main image for the core idea, optional section images for pacing and comprehension, and one controlled roadmap or architecture diagram when relationships matter.

Avoid:

- Markdown tables for important content; WeChat mobile often compresses or breaks them.
- `<br/>` as a spacing technique.
- Every sentence as its own paragraph; this creates a speech-script feeling.
- Dense repeated parallel sentences unless the user explicitly wants a speech-like style.
- Mermaid diagrams or code fences for conceptual explanations that need to display well in WeChat.
- Overloading AI-generated images with tiny text, long Chinese labels, or too many nodes.

Image guidance:

- Main image: express the central thesis, use safe margins, avoid excessive height, avoid large meaningless dark/blank areas, and ensure important subjects are not cropped.
- Section images: use them to create breathing room, attract attention, or clarify one idea; do not add one after every heading by default.
- Roadmaps and architecture diagrams: if text accuracy matters, prefer a controllable generated diagram, SVG, HTML/CSS, or manually composed image rather than relying on image generation for long labels.
- When using generated images with Chinese text, keep text short and explicit; professional terms may remain English.

Mobile publishing checklist before finalizing:

- Tables replaced or confirmed safe.
- Paragraphs are not too fragmented or too dense.
- No `<br/>` used for spacing.
- Images have safe margins, reasonable height, and no cropped core subject.
- Flowcharts and diagrams are readable on a phone screen.
- Public article does not expose internal system names, private project details, or sensitive context.
- 朋友圈配文, if requested, should sound natural and conversational rather than like a technical announcement.

Do not use this mode merely because the text is Chinese. Use it when the target channel is WeChat/mobile publishing or when the user's feedback concerns mobile readability, article images, WeChat formatting, or sharing.

## Running Content Brief

Maintain an implicit brief across turns:

- Topic.
- Intended reader.
- Core tension.
- Thesis or central claim.
- Desired tone.
- Content format.
- Evidence available.
- Claims needing support.
- Decisions the user already accepted.

Use this brief to avoid repeated questions and to keep later outputs aligned with earlier choices. Only show the brief when it helps the user review or correct direction.

## Approval Gates

Use lightweight confirmation at natural transition points:

- Before writing a full draft, confirm the chosen angle or outline.
- Before changing the thesis, name the trade-off.
- When the user approves a direction, treat it as stable unless they revise it.
- If the user asks directly for output, produce it instead of adding another gate.

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

## Title Tasks

When the user asks for titles, do not dump a flat list of many options.

When the title is part of a pre-draft article workflow, provide about 5 options by default, not 2-3. Make the options meaningfully different by reader promise and distribution angle, not just small wording variations.

Prefer this shape:

```text
Recommended title:
...

Why this one:
...

Alternatives by direction:
- More technical: ...
- More opinionated: ...
- More beginner-friendly: ...
```

For technical titles, preserve technical credibility. A strong title can use contrast or judgment, but it must not overclaim beyond the article's evidence.

## Evidence Planning

For claims that would benefit from support, suggest what evidence would strengthen the piece:

- Personal experience.
- Production metrics or usage data.
- Architecture diagram.
- Failure case.
- Before/after comparison.
- User feedback.
- Repository artifacts, docs, or changelog entries.

Do not invent evidence. Mark unsupported claims clearly and help the user decide what can remain as opinion, what needs proof, and what should be softened.

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

### Technical Blog Mode

Use when the user is writing a technical blog, CSDN post, engineering essay, architecture article, source-code analysis, or technical public article.

This is a submode, not the default for all content work.

Good technical blog writing should find the engineering tension before producing prose:

- What common misunderstanding, false shortcut, or incomplete explanation is the article correcting?
- What real system problem, runtime behavior, bottleneck, or operational constraint makes the topic matter?
- What does the technology solve, and what does it not solve?
- What trade-off, boundary, or failure case should keep the article credible?

Prefer angles like:

- Not A, but B.
- Common belief -> engineering reality.
- API detail -> system behavior.
- Tool feature -> operational trade-off.
- Local optimization -> whole-chain effect.

These are internal angle templates. In the final article, express them as headings, topic sentences, tables, or ordinary prose, not as `text` fenced code blocks.

Avoid:

- Empty openings such as "with the development of technology" or "this article will introduce".
- Tutorial boilerplate when the user wants an engineering argument.
- Listing APIs or parameters without explaining the underlying problem.
- Clickbait claims that overrun the evidence.
- Turning an engineering practice article into a project announcement.

For CSDN-style technical articles, it is acceptable to be systematic and detailed, but the piece still needs a clear engineering main thread.

For technical WeChat-style articles, emphasize viewpoint, tension, and reader pull, while keeping technical credibility.

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
- Preserve useful phrases from the user's own framing when they carry the idea.
- When the user is writing a technical blog, prefer engineering tension and mechanism over generic tutorial structure.

## Common Mistakes

- Treating content work as software planning.
- Producing a full draft before clarifying audience and purpose.
- Generating polished but generic writing.
- Defaulting every content request into technical blog mode.
- Inventing facts to make a piece sound stronger.
- Ignoring the user's own voice or lived experience.
- Over-structuring a reflective piece until it loses life.
- Restarting discovery in each turn instead of preserving accepted writing decisions.
