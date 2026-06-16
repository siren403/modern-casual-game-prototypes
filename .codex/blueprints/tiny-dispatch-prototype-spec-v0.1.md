# Tiny Dispatch Prototype Spec v0.1

## Purpose

`Tiny Dispatch` is a hypothetical concept for a compact daily deduction puzzle.

It does not try to invent a new genre. v0 uses established logic-grid / constraint-deduction rules and tests whether a dispatch-board theme can provide a clearer, more ownable wrapper than a generic grid.

## Item-Type Labels

| Name | Type | Meaning |
| --- | --- | --- |
| `Clues by Sam` | actual reference | Reference direction for compact daily clue deduction and authored puzzle validation. |
| `Meowdoku` | actual reference | Reference artifact for production pipeline, friction control, and mobile casual-game systems. |
| `Tiny Dispatch` | hypothetical concept | Operations-themed deduction candidate defined in this spec. |

## Outcome

Build-readiness target:

- The v0 rules are understandable without inventing a new genre.
- Five example puzzles teach the rules step by step.
- Each example puzzle has exactly one solution.
- Each example includes rule explanation and proof trace.
- Implementation does not start until the ambiguity audit is accepted.

## Non-Goals

Do not include in v0:

- route pathfinding,
- shortest-path optimization,
- capacity math,
- vehicle fuel/speed simulation,
- random events,
- hidden information,
- unreliable clues,
- multiple valid endings,
- monetization,
- accounts,
- analytics implementation.

## Core Fantasy

The player is a tiny dispatch operator.

Each puzzle asks:

```text
Which courier carries which parcel to which destination?
```

The satisfaction should come from proving a clean delivery manifest, not from optimizing routes.

## V0 Object Model

Each puzzle has three categories:

| Category | Count | Example Items |
| --- | ---: | --- |
| Courier | 3 or 4 | Mina, Juno, Sol, Rafi |
| Parcel | 3 or 4 | Lantern, Books, Cake, Seeds |
| Destination | 3 or 4 | Library, Bakery, Harbor, Garden |

V0 default:

- 4 couriers,
- 4 parcels,
- 4 destinations.

Puzzle 1 may use 3x3 to teach the base rule.

## Base Rules

### Rule 1: One Courier Gets One Parcel

Each courier carries exactly one parcel.

If Mina carries the Lantern:

- Mina cannot carry any other parcel.
- No other courier can carry the Lantern.

### Rule 2: One Courier Gets One Destination

Each courier goes to exactly one destination.

If Juno goes to the Bakery:

- Juno cannot go to any other destination.
- No other courier can go to the Bakery.

### Rule 3: A Completed Assignment Has Three Parts

A solved row is:

```text
Courier -> Parcel -> Destination
```

Example:

```text
Mina -> Lantern -> Library
```

### Rule 4: No Guessing Required

Every accepted puzzle must have exactly one solution reachable by the allowed clue types.

The player may make notes freely, but the official solution path should not require trial-and-error.

## Marking Rules

Each candidate cell has one of three states:

| State | Meaning |
| --- | --- |
| Unknown | This pairing has not been decided. |
| No | This pairing is impossible. |
| Yes | This pairing is confirmed. |

When a player marks `Yes`:

- all other candidates in that courier/category row become `No`,
- the same item for other couriers becomes `No`,
- contradictions are shown immediately.

When a player marks `No`:

- if only one candidate remains in that row/category, that candidate is forced,
- v0 should suggest the forced mark rather than auto-fill it by default.

## Allowed Clue Grammar

### Type A: Direct Yes

Form:

```text
[Courier] carries [Parcel].
[Courier] goes to [Destination].
```

Rule explanation:

- Mark the exact candidate as `Yes`.
- Apply one-to-one elimination.

### Type B: Direct No

Form:

```text
[Courier] does not carry [Parcel].
[Courier] is not going to [Destination].
```

Rule explanation:

- Mark the exact candidate as `No`.
- If it leaves one candidate, that remaining candidate is forced.

### Type C: Parcel-Destination Link

Form:

```text
The [Parcel] goes to [Destination].
```

Rule explanation:

- Whoever carries that parcel must go to that destination.
- Whoever goes to that destination must carry that parcel.

Example:

```text
The Books go to the Library.
```

If Sol carries Books, Sol goes Library. If Sol goes Library, Sol carries Books.

### Type D: Parcel-Destination Exclusion

Form:

```text
The [Parcel] is not going to [Destination].
```

Rule explanation:

- No courier can have both that parcel and that destination.

Example:

```text
The Cake is not going to the Harbor.
```

If Juno carries Cake, Juno cannot go Harbor. If Juno goes Harbor, Juno cannot carry Cake.

### Type E: Either-Or For One Courier

Form:

```text
[Courier] carries either [Parcel A] or [Parcel B].
[Courier] goes to either [Destination A] or [Destination B].
```

Rule explanation:

- Remove all other candidates for that courier in that category.
- Do not choose between the two remaining candidates until another clue resolves it.

## Deferred Clue Types

Do not use these in v0 examples:

- before/after time ordering,
- route adjacency,
- capacity math,
- exactly-one-of groups beyond standard matching,
- multi-step if-then chains,
- clues involving two unnamed couriers at once,
- numerical counts,
- soft preferences.

Reason:

- v0 should first prove that the base assignment loop is clear.

## UI State Model

The first implementation should use a compact logic board:

- courier rows,
- parcel candidate section,
- destination candidate section,
- clue cards,
- solved manifest summary.

Expected actions:

- inspect clue,
- mark `No`,
- mark `Yes`,
- request hint,
- submit completed manifest.

## Hint / Proof Trace Model

Hints explain deductions, not arbitrary answers.

Hint ladder:

1. Point to the relevant clue.
2. Name the rule type.
3. State the exact mark to make.

Example:

```text
Clue: The Books go to the Library.
Rule: parcel-destination link.
Deduction: if Mina carries Books, Mina must go to Library.
```

## Example Puzzle Set

These five examples are paper-validation content. A brute-force check over all category permutations found exactly one solution for each final clue set.

### Puzzle 1: First Board

Learning goal:

- Teach one-to-one assignment.
- Teach Direct Yes and Direct No.

Size:

- 3 couriers,
- 3 parcels,
- 3 destinations.

Objects:

| Couriers | Parcels | Destinations |
| --- | --- | --- |
| Mina | Lantern | Library |
| Juno | Books | Bakery |
| Sol | Cake | Garden |

Rules explained before play:

- Each courier gets one parcel and one destination.
- Each parcel and destination can be used once.
- A direct "is" clue confirms a candidate.
- A direct "is not" clue removes a candidate.

Clues:

1. Mina carries the Lantern.
2. Juno is not going to the Garden.
3. Sol carries the Cake.
4. The courier with the Books goes to the Library.
5. Mina is not going to the Bakery.

Solution:

| Courier | Parcel | Destination |
| --- | --- | --- |
| Mina | Lantern | Garden |
| Juno | Books | Library |
| Sol | Cake | Bakery |

Proof trace:

1. Mina carries Lantern.
2. Sol carries Cake.
3. By one-to-one parcels, Juno must carry Books.
4. Books go to Library, so Juno goes Library.
5. Mina is not Bakery.
6. Remaining destinations for Mina and Sol are Garden and Bakery.
7. Mina cannot be Bakery, so Mina goes Garden and Sol goes Bakery.

### Puzzle 2: Linked Parcel

Learning goal:

- Teach parcel-destination link.
- Show that knowing a parcel can force a destination.

Objects:

| Couriers | Parcels | Destinations |
| --- | --- | --- |
| Mina | Lantern | Library |
| Juno | Books | Bakery |
| Sol | Cake | Harbor |
| Rafi | Seeds | Garden |

Rules explained before play:

- "The [Parcel] goes to [Destination]" binds parcel and destination together.
- The courier carrying that parcel is also the courier going to that destination.

Clues:

1. The Books go to the Library.
2. Mina carries the Cake.
3. The Cake is not going to the Harbor.
4. Rafi is going to the Garden.
5. Sol does not carry the Lantern.
6. Juno does not carry the Seeds.
7. The Seeds are not going to the Bakery.
8. Rafi does not carry the Seeds.

Solution:

| Courier | Parcel | Destination |
| --- | --- | --- |
| Mina | Cake | Bakery |
| Juno | Books | Library |
| Sol | Seeds | Harbor |
| Rafi | Lantern | Garden |

Proof trace:

1. Mina carries Cake.
2. Cake is not Harbor, so Mina is not Harbor.
3. Rafi goes Garden.
4. Books go Library, so Rafi cannot carry Books.
5. Rafi also cannot Seeds, so Rafi must carry Lantern.
6. Sol cannot Lantern.
7. Juno cannot Seeds.
8. Remaining parcels force Sol -> Seeds and Juno -> Books.
9. Books go Library, so Juno goes Library.
10. Seeds are not Bakery, so Sol cannot Bakery.
11. Remaining destinations after Rafi Garden and Juno Library are Bakery and Harbor.
12. Mina is not Harbor, so Mina goes Bakery and Sol goes Harbor.

### Puzzle 3: Either-Or

Learning goal:

- Teach either-or as candidate narrowing.

Objects:

| Couriers | Parcels | Destinations |
| --- | --- | --- |
| Mina | Lantern | Library |
| Juno | Books | Bakery |
| Sol | Cake | Harbor |
| Rafi | Seeds | Garden |

Rules explained before play:

- "Either A or B" removes all other candidates.
- It does not confirm A or B until another clue resolves the choice.

Clues:

1. Mina carries either Lantern or Books.
2. Mina does not carry the Lantern.
3. The Books go to the Bakery.
4. Juno carries the Cake.
5. The Cake is not going to the Harbor.
6. Rafi is going to the Harbor.
7. Sol does not carry the Seeds.
8. The Lantern goes to the Garden.

Solution:

| Courier | Parcel | Destination |
| --- | --- | --- |
| Mina | Books | Bakery |
| Juno | Cake | Library |
| Sol | Lantern | Garden |
| Rafi | Seeds | Harbor |

Proof trace:

1. Mina carries either Lantern or Books.
2. Mina does not carry Lantern, so Mina carries Books.
3. Books go Bakery, so Mina goes Bakery.
4. Juno carries Cake.
5. Cake is not Harbor, so Juno is not Harbor.
6. Rafi goes Harbor.
7. Lantern goes Garden.
8. Juno already has Cake, so Juno cannot Lantern.
9. Mina has Books, and Sol cannot Seeds.
10. Remaining parcels force Sol -> Lantern and Rafi -> Seeds.
11. Lantern goes Garden, so Sol goes Garden.
12. Remaining destination for Juno is Library.

### Puzzle 4: Negative Link

Learning goal:

- Teach parcel-destination exclusion.

Objects:

| Couriers | Parcels | Destinations |
| --- | --- | --- |
| Mina | Lantern | Library |
| Juno | Books | Bakery |
| Sol | Cake | Harbor |
| Rafi | Seeds | Garden |

Rules explained before play:

- "The [Parcel] is not going to [Destination]" forbids that combined assignment.
- If a courier has the parcel, remove that destination.
- If a courier has the destination, remove that parcel.

Clues:

1. Mina carries the Lantern.
2. The Lantern is not going to the Harbor.
3. Juno is going to the Harbor.
4. The Books go to the Library.
5. Sol does not carry the Cake.
6. Rafi does not carry the Seeds.
7. The Seeds are not going to the Bakery.
8. Mina is not going to the Bakery.

Solution:

| Courier | Parcel | Destination |
| --- | --- | --- |
| Mina | Lantern | Garden |
| Juno | Seeds | Harbor |
| Sol | Books | Library |
| Rafi | Cake | Bakery |

Proof trace:

1. Mina carries Lantern.
2. Lantern is not Harbor, so Mina is not Harbor.
3. Mina is also not Bakery.
4. Books go Library, and Mina has Lantern, so Mina is not Library.
5. Mina must go Garden.
6. Juno goes Harbor.
7. Since Books go Library, Juno cannot carry Books.
8. Sol cannot Cake.
9. Rafi cannot Seeds.
10. Seeds are not Bakery.
11. Remaining destinations after Mina Garden and Juno Harbor are Library and Bakery for Sol and Rafi.
12. If Sol carried Seeds, Sol could not go Bakery, so Sol would have to go Library.
13. But Books go Library, so the courier going Library must carry Books. Sol cannot be both Seeds and Books.
14. Therefore Sol cannot carry Seeds.
15. Sol also cannot Cake, so Sol must carry Books.
16. Books go Library, so Sol goes Library.
17. Rafi cannot Seeds, so Rafi carries Cake.
18. Juno carries remaining Seeds.
19. Rafi goes remaining Bakery.

### Puzzle 5: Mixed Daily Sample

Learning goal:

- Combine direct yes/no, link, negative link, and either-or.
- Represent the first non-tutorial daily puzzle shape.

Objects:

| Couriers | Parcels | Destinations |
| --- | --- | --- |
| Mina | Lantern | Library |
| Juno | Books | Bakery |
| Sol | Cake | Harbor |
| Rafi | Seeds | Garden |

Rules explained before play:

- All previous rules apply.
- There is still no route optimization.
- The puzzle is solved when every courier has one parcel and one destination.

Clues:

1. Sol carries the Books.
2. The Books go to the Library.
3. Mina carries either Lantern or Seeds.
4. Mina does not carry the Lantern.
5. The Seeds go to the Garden.
6. Rafi is going to the Harbor.
7. The Cake is not going to the Harbor.
8. Juno is not going to the Garden.

Solution:

| Courier | Parcel | Destination |
| --- | --- | --- |
| Mina | Seeds | Garden |
| Juno | Cake | Bakery |
| Sol | Books | Library |
| Rafi | Lantern | Harbor |

Proof trace:

1. Sol carries Books.
2. Books go Library, so Sol goes Library.
3. Mina carries either Lantern or Seeds.
4. Mina does not carry Lantern, so Mina carries Seeds.
5. Seeds go Garden, so Mina goes Garden.
6. Rafi goes Harbor.
7. Cake is not Harbor, so Rafi cannot carry Cake.
8. Remaining parcels after Sol Books and Mina Seeds are Lantern and Cake for Juno and Rafi.
9. Rafi cannot Cake, so Rafi carries Lantern.
10. Juno carries Cake.
11. Remaining destination for Juno is Bakery.
12. Juno not Garden is consistent with Mina Garden and reinforces the elimination.

## Example Set Readiness

| Puzzle | Status | Rule Focus |
| --- | --- | --- |
| Puzzle 1 | usable | one-to-one, direct yes/no |
| Puzzle 2 | usable | parcel-destination link |
| Puzzle 3 | usable | either-or narrowing |
| Puzzle 4 | usable | negative link |
| Puzzle 5 | usable | mixed daily sample |

Verification note:

- A brute-force permutation check found exactly one solution for each final clue set.
- The checker was ad hoc; the next artifact should turn this into a reusable puzzle validator.

## Implementation Acceptance Criteria

An implementation of this spec is acceptable only if:

- the game presents v0 as deduction, not route optimization,
- each example puzzle loads from structured data,
- each clue is represented by a typed grammar entry,
- the UI supports `Unknown`, `No`, and `Yes` marks,
- contradiction feedback exists,
- completion checks all assignments against the unique solution,
- hint text can cite a clue and rule type,
- Puzzle 1 teaches base rules before asking for marks,
- all five example puzzles are passable without guessing,
- no clue type outside the v0 grammar is used.

## Spec Ambiguity Audit

Verdict: Ready With Assumptions

Score: 4/5

Blocking ambiguities:

- None for a paper/prototype-spec pass.

Risky ambiguities:

- The exact UI layout is described at system level, not pixel level.
- Auto-fill versus hint-only forced moves is not fully settled.
- The example puzzles are brute-force checked ad hoc, not by a committed reusable solver.
- The concrete TypeScript shape for typed clues is not defined yet.

Assumptions that would make this implementable:

- Use a compact logic-grid board with courier rows and separate parcel/destination sections.
- Forced moves are suggested by hints first; they are not auto-filled in v0.
- All clues are stored as typed constraints, not only natural-language strings.
- The first implementation is a playable prototype, not a polished production app.

Clarifying questions before implementation:

- Should forced single-candidate deductions auto-fill, or should the player confirm them manually?
- Should hints be always available, or gated behind a mistake/idle threshold?
- Should the first implementation include all five puzzles, or only Puzzle 1 plus the data model for the rest?

Implementation readiness:

- Scope: clear for a v0 prototype.
- Inputs/outputs: puzzle objects, typed clues, marks, solution manifest.
- State/data: mostly clear; clue constraint schema still needs concrete TypeScript shape.
- UX/API behavior: clear enough for a first prototype, with layout freedom.
- Validation: clear; next step is a reusable solver/checker or hardcoded uniqueness tests for the five examples.

## Recommended Next Work Unit

Create:

- `Tiny Dispatch Puzzle Data Schema v0.1`

It should define:

- TypeScript-like puzzle JSON,
- clue type enums,
- constraint validation functions,
- proof trace format,
- uniqueness-check expectations.
