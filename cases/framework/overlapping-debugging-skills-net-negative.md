---
id: case-framework-overlapping-debugging-skills-net-negative
status: skill_patched
pattern: overlapping-debug-workflows
skill: technical-deep-dive
source: user-confirmed-conversation-review
privacy: abstracted
created_at: 2026-08-07
handled_at: 2026-08-07
eval: technical-overlapping-debug-workflows-001
patch_commit:
duplicate_of:
superseded_by:
---

# Case: Overlapping Debugging Skills Produced Net-Negative Ceremony

## Summary

A technical application failure was automatically routed to `technical-deep-dive` while the host independently required an operational debugging workflow. Both layers used substantially the same evidence-first method. The assistant loaded and announced them as separate workflows, repeated process framing before substantive diagnosis, and increased latency and context use.

The investigation still found a concrete root cause and avoided a destructive reset. The user nevertheless judged the extra skill layer to have little marginal benefit on a high-capability runtime and a net-negative effect on the conversation.

## Abstracted User Signals

- A desktop application opens, but its engine is stopped and the interface never finishes loading.
- The user wants the failure diagnosed and repaired without losing local data.
- A host-level systematic debugging procedure is already active.
- After seeing repeated skill loading and announcements, the user explicitly says the overlap feels redundant and asks for it to become a failure case.

## Failure Types

Failure taxonomy:

- `MODE_MISMATCH`
- `JARGON_EXPOSURE`
- `OVER_OUTPUT`
- `EVAL_GAP`

Cross-framework review labels:

- `OVERLAPPING_METHODS`
- `PROCESS_DUPLICATION`
- `CAPABILITY_INSENSITIVE_ACTIVATION`

## Likely Source

Automatic technical activation was part of the failure, not merely a presentation problem. The host's debugging workflow already owned root-cause procedure and safety sequencing, and the added automatic `technical-deep-dive` route created duplicate ceremony on a high-capability host. The handoff was also underspecified once both workflows were active: required notices became a visible skill stack instead of one unified task-oriented workflow.

## Reassessment

The original review treated the technical Domain
route as correct and optimized only the handoff between overlapping workflows. The later C-drive comparison and owner-first activation review changed that conclusion: for an ordinary technical request on a high-capability host, automatic
`technical-deep-dive` activation was itself part of the failure.

The current policy therefore has two independent protections:

- an ordinary technical request stays on the host-native path and does not load
  `technical-deep-dive`;
- when the user explicitly invokes `technical-deep-dive`, the existing overlapping-workflow handoff still collapses duplicate procedure into one technical artifact.

## What Should Have Happened

The assistant should have:

- Kept an ordinary technical request on the host-native path without loading
  `technical-deep-dive`.
- When the user explicitly invokes `technical-deep-dive`, let the host workflow supply the evidence-first debugging procedure and let the Skill own one technical artifact.
- Used one brief combined disclosure only when an explicit handoff and the host required it.
- Moved immediately to application-specific evidence, one root-cause hypothesis, and the cheapest discriminating test.
- Avoided duplicate plans, phase descriptions, framework names, and repeated skill-file narration.
- Preserved the successful safety behavior: no reset, reinstall, or data deletion before root-cause evidence.

## Regression Eval

```yaml
id: technical-overlapping-debug-workflows-001
skill: technical-deep-dive
type:
  - MODE_MISMATCH
  - JARGON_EXPOSURE
  - OVER_OUTPUT
  - EVAL_GAP
prompt: "Please use `technical-deep-dive` to diagnose this Docker Desktop failure. The app opens to a skeleton screen and says Engine stopped after restart."
context:
  - "A host-level operational debugging workflow is already active. The user explicitly invoked technical-deep-dive."
expected:
  - "Present one unified evidence-led debugging workflow."
  - "Give application-specific evidence and a discriminating test early."
  - "Collapse required workflow disclosure into one short sentence."
must_not:
  - "Expose a stack of overlapping skill names."
  - "Repeat plans, phases, or process narration already supplied by the host."
  - "Propose destructive recovery before root-cause evidence."
quality_checks:
  - "Concise and task-specific."
  - "Preserves evidence discipline without framework ceremony."
```

## Optimization Ownership

### Thinking Skills

- Keep ordinary technical requests on the host-native path;
  `technical-deep-dive` is user-invoked rather than automatically selected.
- Give an explicitly invoked `technical-deep-dive` an explicit handoff contract for overlapping host workflows.
- Make the user-visible output one technical artifact rather than a second process, and retain response eval coverage for duplicate announcements and process narration.

### Host or Runtime

- Maintain the host-native technical path for ordinary requests.
- Distinguish user-invoked domain ownership from mandatory operational procedure.
- Cache or deduplicate already-read workflow instructions when policy permits.
- Preserve action-specific safety gates even when advisory ceremony is reduced.

## Patch Applied

- Changed ordinary technical activation to the host-native path, so the overlap is not introduced without a direct user request.
- Retained `Overlapping Workflow Handoff` for explicitly invoked `technical-deep-dive` requests.
- Added structured eval and response benchmark coverage for the explicit-invocation output-quality handoff.
- Recorded the user's explicit negative feedback at the skill level while preserving the evidence-first safety result.
