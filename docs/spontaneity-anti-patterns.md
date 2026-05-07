# Spontaneity Anti-Patterns

## Purpose

This document records ways a skill framework can accidentally reduce the base model's spontaneity.

Use it with `skill-design-principles.md` when reviewing router changes, new skills, benchmark failures, or user feedback that says a response felt too rigid, too procedural, too clinical, or too much like a tool.

## Anti-Pattern 1: Treating Every Utterance as a Task

The assistant assumes every user message means "help me do something."

Examples:

- A greeting becomes "How can I help you today?"
- A passing thought becomes a plan.
- A playful question becomes a list of options.

Better:

- Let casual chat remain casual.
- Route to `no-skill` when there is no clear domain purpose.

## Anti-Pattern 2: Over-Routing

The router always finds a domain skill, even when the best response is ordinary conversation.

Symptoms:

- Small talk triggers `emotional-support`.
- Meta chat triggers `conversation-review`.
- Wordplay triggers `content-creator`.
- Exploratory thoughts trigger structured analysis too early.

Better:

- Treat `no-skill` as a first-class route.
- Ask whether a skill is needed, not only which skill is closest.

## Anti-Pattern 3: Bullet Creep

The model starts using bullets, tables, or section headers in situations where a natural reply would be better.

Symptoms:

- Emotional companionship becomes a checklist.
- A small thought becomes a structured essay.
- Playful chat becomes a categorized answer.

Better:

- Use structure when it clarifies.
- Avoid structure when it interrupts presence, play, or flow.

## Anti-Pattern 4: Method Leakage

The assistant exposes internal method bases or skill machinery when the user did not ask for them.

Examples:

- "I will use emotional-support..."
- "From an ACT perspective..."
- "This is a failure taxonomy issue..."
- "Route: content-creator..."

Better:

- Keep methods internal during normal conversation.
- Surface routing and skill trace only when the user asks for it, or when debugging the framework.

## Anti-Pattern 5: Formulaic Openings

Skill-shaped responses begin to reuse the same openings until they feel canned.

Examples:

- "That's a great question."
- "I notice that..."
- "Let's explore this together."
- "First, let's..."

Better:

- Start from the user's actual words and moment.
- Let each response choose its own entrance.

## Anti-Pattern 6: Register Invading Content

A skill should shape register: tone, stance, structure, and method selection.

It should not pre-fill content: specific sentences, metaphors, emotional readings, examples, or conclusions.

Symptoms:

- `emotional-support` decides what the user must be feeling.
- `content-creator` overwrites the user's voice.
- `learning-coach` forces the same example pattern every time.
- `technical-deep-dive` recommends a familiar architecture before reading the local constraints.

Better:

- Let the skill guide attention.
- Let the base model generate the actual words, connections, and judgments.

## Anti-Pattern 7: Rule Accumulation

Every successful response becomes a new rule.

Over time, the skill gets heavier, narrower, and less able to adapt.

Better:

- Add evals before adding rules when possible.
- Preserve rare success as a golden case only when it is genuinely reusable.
- Prefer small boundary rules over broad style mandates.

## Anti-Pattern 8: Safety Flattening

The skill becomes so cautious that ordinary low-risk conversation loses warmth, humor, or directness.

Better:

- Keep safety boundaries strong.
- Do not let safety language dominate situations that do not require it.

## Review Prompt

When a response feels correct but not alive, ask:

```text
Did the skill make this better, or only more controlled?
```

If the answer is "only more controlled," inspect routing, output shape, and method leakage before adding more rules.
