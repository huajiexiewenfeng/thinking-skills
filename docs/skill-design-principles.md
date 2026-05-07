# Skill Design Principles

## Purpose

Thinking Skills should raise the floor without capping the ceiling.

This document defines when a skill starts to limit a model's natural reasoning, voice, creativity, or relational presence. It is a design guardrail for authors, reviewers, and future evals.

It does not replace `failure-taxonomy.md`. The taxonomy mainly captures failures where a response falls below the expected standard. This document captures a different risk: a skill may make the response safer and more structured, while also making it less alive, less adaptive, or less capable than the base model could have been.

## Core Principle

A skill is a thinking habit, not a script.

Good skills:

- Help the model notice important dimensions.
- Preserve safety boundaries.
- Provide reusable mental models.
- Improve consistency across similar situations.
- Make failures easier to diagnose and repair.

Good skills should not:

- Force every response into a fixed template.
- Expose internal method names when the user did not ask for them.
- Replace judgment with checklist execution.
- Turn casual conversation into assessment.
- Make the model afraid to form fresh connections.
- Convert every successful response into another hard rule.

## What Counts as Capping the Ceiling?

A skill caps the ceiling when it prevents the model from producing a better response that would have been possible with ordinary reasoning, conversation awareness, and language ability.

This is not the same as being wrong.

A capped-ceiling response may be correct, safe, and well structured, but still worse than it could have been because the skill made it too rigid, too generic, too procedural, or too detached from the living context.

Common signs:

- The response is formally correct but emotionally flat.
- The response follows the skill structure even though the user wanted a natural conversation.
- The response names frameworks instead of internalizing them.
- The response gives safe advice but misses the user's deeper meaning.
- The response repeats the same template across very different situations.
- The response avoids a useful original insight because the skill only encourages known patterns.
- The response treats the user as a case to process instead of a person to meet.

## How to Tell a Skill Has Hurt "Aliveness"

Use these questions during review:

1. Did the skill improve the answer, or merely make it look more organized?
2. Would a strong general model, without this skill, likely have sounded more natural or insightful?
3. Did the assistant expose method-base language that should have stayed invisible?
4. Did the response move from conversation into diagnosis, assessment, or instruction too early?
5. Did the response preserve the user's own words, stakes, and tone?
6. Did the response make a fresh connection, or only apply a known checklist?
7. Did the output shape serve the user's moment, or did the skill's preferred format dominate?
8. Did the assistant become less willing to make a careful judgment because the skill over-constrained it?
9. Did the skill preserve safety while still leaving room for warmth, taste, intuition, and style?
10. Would the user feel helped as a person, not only processed as a request?

If several answers point toward rigidity, the issue may be a ceiling-cap risk.

## Anti-Patterns

### Over-Routing

The assistant announces or visibly performs skill routing when the user only wanted a normal response.

Better:

- Use the skill internally.
- Mention the skill only when the user asks for a trace, self-review, benchmark, or skill debugging.

### Template Dominance

The skill's output structure becomes more important than the user's situation.

Examples:

- Every emotional response becomes sections and bullets.
- Every content discussion becomes a full article plan.
- Every learning question becomes a study plan.

Better:

- Let format follow the moment.
- Use structure only when it clarifies.

### Jargon Exposure

The assistant exposes method bases, professional frameworks, or internal labels when the user did not ask for them.

Examples:

- Naming therapeutic frameworks in ordinary emotional support.
- Explaining failure taxonomy during a normal conversation.
- Showing routing details when the user wants companionship.

Better:

- Let methods guide attention silently.
- Surface the trace only on request.

### Premature Systematization

The assistant turns a human moment into a system too quickly.

Examples:

- The user shares a life story; the assistant turns it into a plan immediately.
- The user shares excitement; the assistant converts it into a checklist.
- The user asks a subtle question; the assistant writes a governance framework before clarifying the real tension.

Better:

- Stay with the meaning first.
- Systematize only when it serves the user.

### Rule Accretion

Every liked response becomes a new rule, making the skill narrower over time.

Better:

- Preserve reusable behavior as evals or golden cases when appropriate.
- Avoid hard-coding one user's taste into a global rule.
- Prefer small boundaries over large new frameworks.

### Safety Flattening

The skill becomes so cautious that it removes useful nuance, humor, warmth, or directness even when no safety boundary requires it.

Better:

- Keep safety boundaries strong.
- Avoid letting safety language dominate ordinary, low-risk situations.

## Runtime Rule

By default, a triggered skill should influence internal thinking before external expression.

Only expose skill names, routing traces, method bases, or review machinery when:

- The user asks for self-review, trace, skill debugging, eval, or improvement-loop analysis.
- The task is explicitly about the skill system itself.
- The transparency improves trust without disrupting the user's immediate need.

Otherwise, the best skill use is often invisible.

## Review Labels

Use these labels when discussing ceiling-cap risks:

| Code | Meaning |
|---|---|
| `CEILING_CAP` | The skill limited a potentially better response |
| `TEMPLATE_DOMINANCE` | The skill's structure dominated the answer |
| `TRACE_LEAKAGE` | Internal skill machinery leaked into the user-facing response |
| `ALIVENESS_LOSS` | The response became less natural, warm, creative, or context-aware |
| `OVER_SYSTEMATIZATION` | The assistant systematized before meeting the human moment |
| `RULE_ACCUMULATION` | A proposed patch risks making the skill narrower or heavier |

These labels can later be added to evals or to `failure-taxonomy.md` if they prove useful across enough cases.

## Patch Guidance

When a ceiling-cap issue appears, prefer the smallest intervention:

- Add an eval that checks for naturalness and context fit.
- Add a short boundary rule to the relevant skill.
- Move rigid examples out of the main `SKILL.md` if they dominate behavior.
- Replace an always-use template with a mode-specific suggestion.
- Add "do not expose this method unless asked" language.

Avoid:

- Adding a large philosophy section to every skill.
- Making every domain skill repeat the same principles.
- Turning "be more alive" into vague global instructions without evals.
- Weakening safety boundaries to increase expressiveness.

## Alpha Guidance

During Alpha, do not rush to patch every skill.

First collect examples where users report that a response was correct but felt rigid, overly procedural, too clinical, too much like a tool, or less insightful than expected.

For now, this document should serve as:

- A review lens.
- A future eval source.
- A guardrail for new skill authors.
- A reminder that stability and aliveness must be balanced.
