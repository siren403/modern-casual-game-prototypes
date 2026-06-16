# Circuit Sketch Stop Decision

## Metadata

- Date: 2026-06-16
- Topic: whether to continue validating `Circuit Sketch` as the first symbol-domain prototype.
- Status: Accepted
- Owner: Codex
- Review by: user

## Context

`Circuit Sketch` was created as a hypothetical concept to test whether a `Ribbit-like pattern` could transfer from word paths to a smaller symbol grammar.

The playable Pixi prototype reached a minimum viable stress test:

- mobile-first canvas shell,
- drag-owned Pixi input,
- Korean HUD copy,
- no page scroll in the game route,
- no long-press text selection,
- a tempting invalid path,
- a valid path requiring a switch-before-lamp rule,
- Playwright validation for invalid and valid paths.

The question is no longer whether it can be implemented. The question is whether it shows enough distinct promise to keep investing.

## Confirmed Facts

- Fact: The prototype can express a small authored symbol rule.
  Evidence: `src/prototypes/circuitSketch.ts` supports a switch-first path rule and deployed successfully to GitHub Pages.

- Fact: The current player-facing experience still reads mostly as conditional line drawing.
  Evidence: user evaluation after hands-on play: the experience is too far from `Meowdoku` or `Clues by Sam` and lacks a special point.

- Fact: The concept has not produced a strong equivalent to the word/deduction appeal that motivated the reference search.
  Evidence: adding a switch rule improved validation structure but did not create a clear "candidate generation -> meaning/deduction -> aha" loop.

## Assumptions

- Assumption: If a prototype still feels like a generic line-connecting puzzle after the first discriminating rule is added, further local polish will have poor return.
  Risk if wrong: a later mechanic could have unlocked the concept, but there is no concrete hook currently visible.

- Assumption: The workspace's main objective is reusable production know-how and promising concept selection, not rescuing every probe.
  Risk if wrong: stopping early could miss a narrow implementation learning opportunity, but the current probe has already yielded enough Pixi/mobile-shell lessons.

## Decision

Stop `Circuit Sketch` as a candidate concept.

Keep it as a documented probe and technical shell reference, but do not continue gameplay validation unless a new, specific hook is proposed that changes the core experience beyond "draw a valid path through components."

## Rationale

- Why this option fits the evidence:
  - The implementation reached the intended stress-test threshold.
  - The concept still lacks a strong distinctive player promise.
  - It does not currently match the appeal level of the studied references.

- Why now:
  - Continuing would likely optimize presentation and rule density around a weak center.
  - The next useful decision is domain selection, not more line-drawing iteration.

## Alternatives Considered

- Option: Continue adding circuit components such as resistors, motors, overloads, and split paths.
  Reason rejected: this increases rule count but does not guarantee a better core loop; it risks becoming a thin puzzle grammar wrapped around line drawing.

- Option: Retheme the same mechanic again.
  Reason rejected: the issue is not only theme. The issue is weak correspondence to the reference appeal: no strong semantic deduction or surprise.

- Option: Keep polishing mobile UX.
  Reason rejected: the shell is already adequate for this decision. UX polish cannot create the missing concept hook.

## Open Questions

- Question: Which next domain best converts reference lessons into a stronger original concept?
  Blocks implementation: Yes

- Question: Should the next prototype target `Clues by Sam`-style deduction rather than `Ribbit`-style path tracing?
  Blocks implementation: Yes

## Implementation Tasks

- Task: Do not schedule more `Circuit Sketch` gameplay features.
  Owner: Codex
  File scope: planning docs and future task selection
  Expected behavior change: future work avoids treating `Circuit Sketch` as the main candidate.

- Task: Preserve the Pixi shell and Playwright validation as reusable harness knowledge.
  Owner: Codex
  File scope: `.codex/skills/pixi-mobile-game-shell/`, `scripts/verify-pixi-shell.cjs`
  Expected behavior change: future Pixi prototypes reuse the shell standard without inheriting the circuit concept.

## Validation Plan

- Check: Future planning documents label `Circuit Sketch` as a stopped hypothetical concept, not an active product direction.
  Command or review method: review `.codex/decision-logs/` and `.codex/discussion-rounds/`.

## Risks

- Risk: The prototype remains deployed and may be mistaken for a recommended direction.
  Mitigation: label it as a stopped probe in future summaries and selection docs.
  Accepted: Yes

## Revisit Conditions

- Revisit only if a new mechanic creates a qualitatively different loop, such as hidden-state deduction, surprising transformation, or meaningful multi-solution tradeoff that is not just path validity.
