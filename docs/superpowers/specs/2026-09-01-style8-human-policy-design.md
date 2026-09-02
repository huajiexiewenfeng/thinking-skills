# Style 8 Human-Element Policy Design

## Problem

Style 8 repeatedly renders the same bald cartoon instructor on the left side of otherwise unrelated article illustrations. The behavior is deterministic enough to be a contract problem, not a one-off image-generation defect: the protocol names a visible narrator and miniature instructor as first-class elements, the cover and concept golden prompts require people, and the reference matrix encourages narrator continuity.

## Decision

Style 8 becomes human-free by default for cover, concept, and diagram roles.

A generic human symbol is allowed only when both conditions are true:

1. the article semantics explicitly require a human actor, such as a user, team member, reviewer, or handoff participant;
2. the approved asset brief names that actor and explains why a non-human technical primitive would lose meaning.

Even under that exception, Style 8 must not introduce a recurring instructor, narrator, mascot, or character identity.

## Contract Changes

- Replace instructor and visible-narrator language with non-human explanatory primitives: documents, code blocks, queues, clocks, formulas, arrows, boundaries, state cards, and technical icons.
- Make the default figure policy explicit in the protocol and every role contract.
- Add reference-isolation rules that forbid copying character identity, face, pose, silhouette, or people count from any golden or article anchor.
- Rewrite the cover and concept golden prompts so their compositions contain no people while preserving warm paper, lively ink, semantic pastel roles, teaching density, and clear reading paths.
- Keep the diagram role human-free without changing its semantic-topology safeguards.

## Golden Migration

The cover and concept golden assets move to new human-free revisions. Existing approved images remain untouched until replacement candidates are shown and explicitly approved. After approval, update the artifact hashes, prompt hashes, reference roles, revision notes, and version identifiers in `golden-set.json`.

## Validation

Automated contract tests must fail against the current pack and pass only when:

- the protocol declares human-free defaults and the explicit semantic exception;
- cover and concept contracts prohibit unapproved humans and recurring narrator or mascot characters;
- the reference matrix forbids copying character identity, face, pose, silhouette, and people count;
- cover and concept golden prompts use non-human technical subjects;
- the existing diagram human-free and frozen-topology rules still pass.

Release validation also includes prompt compilation, Style Pack validation, the full article-visual-director test suite, hash consistency, and visual inspection of the two approved replacement goldens.

## Scope

This change affects Style 8 only. It does not change the nine-style menu, Style 8 color/material identity, article image-density behavior, Style 9, or the fourth article the user excluded.
