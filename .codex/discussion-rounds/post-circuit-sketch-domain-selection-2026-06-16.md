# Post-Circuit Sketch Domain Selection Round

## Metadata

- Date: 2026-06-16
- Topic: next concept direction after stopping `Circuit Sketch`.
- Status: analysis round with recommendation.
- Trigger: user judged `Circuit Sketch` as too weak compared with `Meowdoku` and `Clues by Sam`.
- Non-goal: do not implement a new prototype in this round.

## Item-Type Labels

| Name | Type | Meaning |
| --- | --- | --- |
| `Meowdoku` | actual reference | Imported Godot project used for production know-how analysis. |
| `Clues by Sam` | actual reference | Reference direction for daily deduction, clue grammar, and compact puzzle sessions. |
| `Ribbit` | actual reference | Reference direction for path tracing and word-list exploration. |
| `Circuit Sketch` | hypothetical concept | Stopped symbol-domain probe derived from the `Ribbit-like pattern`. |
| `Tiny Dispatch` | hypothetical concept | Operations-themed daily deduction candidate. |
| `Alibi Grid` | hypothetical concept | Mystery-themed daily deduction candidate. |
| `Spellbook Lab` | hypothetical concept | Magical lab-themed daily deduction candidate. |

## Shared Conclusion

The next attempt should not continue the `Ribbit` path-tracing conversion.

The stronger route is to move back toward `Clues by Sam`-style strengths:

- compact daily puzzle,
- explicit clue grammar,
- deterministic validation,
- authored difficulty,
- proof trace or hint ladder,
- small but extensible content schema.

This does not mean cloning `Clues by Sam`. It means using its production lessons while choosing a domain that can become an original product.

## Evaluation Frame

The next domain should score well on:

- `deduction density`: each clue changes the player's belief state.
- `authoring feasibility`: a small team can make puzzles without a huge database.
- `solver readiness`: puzzles can be mechanically validated.
- `first-screen clarity`: the player understands what kind of reasoning is expected.
- `identity`: the theme has a reason to exist beyond a spreadsheet.
- `packability`: future content packs are natural.

## Creative Game Concept Strategist

### Verdict

Stop searching for a clever symbol replacement for words. The next concept needs a clearer player fantasy than "trace the right icons."

### Candidate View

`Tiny Dispatch` is the best next candidate because the fantasy is immediately operational:

- assign people,
- carry items,
- choose destinations,
- satisfy constraints.

It has a strong chance of feeling distinct from direct detective logic while keeping the deduction center.

`Spellbook Lab` has stronger visual identity but higher risk. Players may expect crafting or experimentation, so the deduction promise must be unusually clear.

`Alibi Grid` is safest mechanically but closest to established mystery deduction patterns.

### Recommendation

Pick `Tiny Dispatch` for the next spec pass.

## Puzzle Level Design Analyst

### Verdict

The failure mode of `Circuit Sketch` is low deduction density. Most moves are spatial continuation, not reasoning.

### What The Next Candidate Needs

The next candidate should make each interaction answer a question:

- Can courier A take parcel B?
- Does destination C belong before destination D?
- Which remaining slot is forced?
- Which clue eliminates this assignment?

This maps better to `Clues by Sam` than to path tracing.

### Candidate Ranking

1. `Tiny Dispatch`
   - strongest solver fit,
   - clear finite assignment model,
   - easy to author and validate.

2. `Alibi Grid`
   - strong solver fit,
   - high clarity,
   - weaker originality unless presentation is excellent.

3. `Spellbook Lab`
   - strong identity,
   - more ambiguity risk,
   - more likely to overpromise simulation.

### Recommendation

Write a `Tiny Dispatch` prototype spec before building anything.

The spec should lock:

- object categories,
- allowed clue types,
- mark states,
- completion condition,
- proof trace requirements,
- five example puzzles.

## Retention/Onboarding UX Analyst

### Verdict

`Circuit Sketch` did not establish why a player should come back tomorrow.

The next concept must make the daily result feel like a completed problem, not a completed route.

### UX Requirements For The Next Attempt

- The first 10 seconds must say "deduce assignments from clues."
- The UI must not hide the reasoning state.
- Wrong marks should be reversible.
- Hints should explain a deduction, not point to a tile.
- The completion screen should summarize the solved assignment.

### Candidate View

`Tiny Dispatch` can present as a small daily board with a satisfying final schedule or delivery manifest.

`Spellbook Lab` can be charming, but the first-time player may try to experiment instead of deduce.

`Alibi Grid` is clear but may feel familiar unless the case-board interaction is distinctive.

### Recommendation

Use `Tiny Dispatch` as the default next prototype because it offers the best balance of clarity and originality.

## Adversarial Critic

### Verdict

Do not overcorrect from `Circuit Sketch` into a heavy production plan.

The next step should be a spec and paper-level puzzle validation, not another deployed prototype immediately.

### Objections

- `Tiny Dispatch` can become dry and spreadsheet-like.
- `Alibi Grid` can become a generic logic-grid clone.
- `Spellbook Lab` can become arbitrary if the player cannot infer rules.

### Required Bar Before Implementation

Any next concept must pass these checks before code:

- at least five manually written puzzles,
- all puzzle solutions solver-checkable or manually proof-traced,
- each clue type is unambiguous,
- one sample puzzle can be explained in a single screen,
- the domain has one memorable visual promise.

### Recommendation

Proceed with `Tiny Dispatch`, but only as a written spec and sample puzzle set first.

## Synthesis Architect

### Decision

The next direction should be:

`Tiny Dispatch Prototype Spec v0.1`

This is a better bridge from the current knowledge base than another path-tracing probe because it preserves the production-relevant parts:

- authored clue schema,
- solver validation,
- daily puzzle loop,
- difficulty calibration,
- analytics-ready completion funnel,
- pack expansion.

### Why Not Continue Circuit Sketch

`Circuit Sketch` answered the implementation feasibility question but failed the concept-promise question.

Its strongest reusable output is not the game idea. Its strongest reusable output is the Pixi mobile shell and validation checklist.

### Recommended Next Work Unit

Create `Tiny Dispatch Prototype Spec v0.1`.

It should include:

- domain promise,
- v0 object schema,
- allowed clue grammar,
- UI state model,
- player interaction rules,
- hint/proof trace model,
- five example puzzles,
- ambiguity audit,
- implementation acceptance criteria.

## Final Recommendation

Move on from `Circuit Sketch`.

Use the next work unit to write and audit `Tiny Dispatch Prototype Spec v0.1`. Do not implement the Pixi prototype until the spec proves that the deduction loop is clear on paper.

## Turn-End Direction Options

Recommended:

- `Tiny Dispatch spec`: define the first real deduction candidate with example puzzles and an ambiguity audit.

Other viable options:

- `Spellbook Lab concept sheet`: explore a stronger-identity but riskier deduction domain before choosing.
- `Clues by Sam pattern extraction pass`: deepen reference analysis before selecting any new domain.
