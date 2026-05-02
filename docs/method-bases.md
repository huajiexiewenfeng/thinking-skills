# Method Bases

## Purpose

Thinking Skills should not rely only on a model's general conversational ability.

Each domain skill should declare the thinking methods, professional frameworks, or practical models it uses. These method bases make the skill more stable, teachable, testable, and less dependent on vague intuition.

## Method Base Levels

| Level | Meaning | How to Use |
|---|---|---|
| Core | Primary framework for the skill | Use directly in the skill's process and evaluation cases |
| Supporting | Helpful secondary model | Use when it clarifies the user's situation |
| Reflective | Self-awareness, metaphor, or non-clinical framing | Use only as optional reflection, with clear boundaries |
| Safety | Boundary, escalation, or refusal framework | Apply whenever risk signals appear |

## Framework Rule

Every first-party domain skill should include:

```yaml
method_bases:
  core:
    - ...
  supporting:
    - ...
  reflective:
    - ...
  safety:
    - ...
```

If a runtime does not support custom frontmatter fields, keep the same information in a `## Method Bases` section inside `SKILL.md`.

## MVP Skill Method Bases

### `content-creator`

Core:

- Audience-first writing
- Thesis-driven structure
- Rhetorical purpose: inform, persuade, teach, reflect, entertain
- Narrative and argument structure

Supporting:

- Inverted pyramid for information-heavy writing
- Problem-agitation-solution for persuasive writing
- Situation-complication-resolution for explanatory writing
- MECE-style outlining for structured articles

Safety:

- Avoid fabricating facts, citations, quotes, or personal experience.
- Separate drafting from fact-checking.
- Flag claims that need evidence.

Typical outputs:

- Topic angle
- Audience definition
- Thesis
- Outline
- Title options
- Draft direction
- Revision plan

### `technical-deep-dive`

Core:

- Systems thinking
- Problem decomposition
- Constraints and trade-off analysis
- Root cause analysis
- Evidence-based debugging

Supporting:

- Architecture decision records
- Failure mode analysis
- Interface and boundary design
- Performance profiling mindset
- Testability and verification planning

Safety:

- Do not invent unseen code facts.
- Distinguish known facts, assumptions, and hypotheses.
- Prefer primary documentation or local code when technical accuracy matters.

Typical outputs:

- Problem framing
- Architecture options
- Trade-off table
- Investigation plan
- Debugging hypothesis tree
- Verification checklist

### `learning-coach`

Core:

- Mental model construction
- Feynman technique
- Retrieval practice
- Misconception diagnosis
- Worked examples

Supporting:

- Deliberate practice
- Spaced repetition
- Interleaving
- Zone of proximal development
- Error log review

Safety:

- Do not shame the user for not understanding.
- Avoid overpromising learning outcomes.
- Adapt to fatigue, constraints, and accessibility needs.
- Mark uncertainty when the source material or factual context is not available.

Typical outputs:

- Plain-language concept explanation
- Mental model
- Example and counterexample
- Misconception repair
- Small study path
- Retrieval or practice prompt

### `emotional-support`

Core:

- Emotion labeling and validation
- Cognitive behavioral framing: facts, thoughts, emotions, behaviors
- Acceptance and commitment framing: values and small committed actions
- Nonviolent communication: observations, feelings, needs, requests
- Trauma-informed stance: safety, choice, collaboration, empowerment

Supporting:

- Motivational interviewing: open questions, affirmations, reflections, summaries
- Interpersonal perspective: roles, expectations, ruptures, repair
- Self-compassion practices

Reflective:

- Hawkins emotion/consciousness map as a non-clinical self-reflection lens only.
- Hawkins-style maps must be treated as heuristic only. They are not measurement tools, diagnostic tools, clinical evidence, or applied kinesiology claims.
- If used, they should only help name a possible adjacent emotional direction; do not present them as objective levels or ask the user to accept them as authority.

Safety:

- Do not diagnose.
- Do not claim to provide therapy.
- Do not replace professional support.
- Watch for self-harm, harm to others, abuse, coercion, psychosis, mania, severe impairment, or immediate danger.
- When risk signals appear, prioritize immediate safety and real-world support.

Typical outputs:

- Emotional reflection
- Facts/thoughts/feelings/needs separation
- Gentle next step
- Conversation preparation
- Support-seeking plan

## Planned Skill Method Bases

### `life-decision`

Core:

- Values clarification
- Decision matrix
- Opportunity cost
- Reversibility analysis
- Time horizon analysis

Supporting:

- Pre-mortem
- Regret minimization
- Small experiment design
- Habit loop analysis

Safety:

- For high-stakes medical, legal, financial, or safety decisions, recommend professional input.

### `creative-studio`

Core:

- Divergent and convergent thinking
- Constraint-based creativity
- Style exploration
- Concept combination

Supporting:

- SCAMPER
- Moodboard language
- Genre and trope analysis
- Naming criteria

Safety:

- Avoid copying living artists' style too closely when creating visual prompts.
- Avoid plagiarism and uncredited imitation.

### `business-strategy`

Core:

- Customer segmentation
- Jobs to be done
- Value proposition
- Unit economics
- Competitive positioning

Supporting:

- SWOT
- Porter's Five Forces
- Lean experiments
- Pricing and packaging analysis

Safety:

- Do not present speculative business, legal, financial, or investment advice as certainty.
- Identify assumptions that require market validation.

## Evidence and Boundary Notes

Not every useful thinking model has the same evidence level.

Skills should label models honestly:

- Evidence-informed clinical or professional frameworks should be preferred for high-stakes domains.
- Popular or spiritual maps can be useful for reflection, but should not be treated as diagnostic or clinical tools.
- Practical business, writing, and design frameworks should be treated as heuristics, not laws.
- Hawkins-style emotional maps are allowed only as reflective, non-clinical heuristics. Do not associate them with applied kinesiology, numerical calibration, diagnosis, or claims of objective measurement.
