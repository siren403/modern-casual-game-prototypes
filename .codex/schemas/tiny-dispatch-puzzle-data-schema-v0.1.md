# Tiny Dispatch Puzzle Data Schema v0.1

## Purpose

This document defines the implementation-facing data contract for `Tiny Dispatch` v0.1.

It exists to prevent prototype code from inventing puzzle rules ad hoc. The game remains a standard logic-grid / constraint-deduction puzzle; the schema only formalizes couriers, parcels, destinations, clues, solutions, and validation expectations.

Related artifacts:

- `.codex/blueprints/tiny-dispatch-prototype-spec-v0.1.md`
- `.codex/blueprints/tiny-dispatch-puzzle-set-v0.1.md`

## Scope

Included:

- puzzle JSON shape,
- clue type enum,
- typed clue payloads,
- solution manifest shape,
- mark-state shape,
- proof trace shape,
- validator expectations,
- example encoding for Puzzle 1.

Excluded:

- UI layout details,
- generator design,
- route/pathfinding data,
- time ordering,
- analytics events,
- monetization.

## Canonical IDs

Every object uses a stable lowercase kebab-case id.

Examples:

```text
mina
juno
lantern
library
```

Rules:

- ids are unique within their category,
- ids are never shown directly to players,
- display labels may be localized later,
- clue payloads reference ids only.

## TypeScript-Like Types

```ts
type EntityId = string;

type Entity = {
  id: EntityId;
  label: string;
};

type PuzzleDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

type Puzzle = {
  id: string;
  title: string;
  version: '0.1';
  difficulty: PuzzleDifficulty;
  learningGoal: string[];
  rulesBeforePlay: string[];
  entities: {
    couriers: Entity[];
    parcels: Entity[];
    destinations: Entity[];
  };
  clues: Clue[];
  solution: SolutionManifest;
  proofTrace: ProofStep[];
};
```

## Solution Manifest

The solution stores one completed row per courier.

```ts
type SolutionManifest = Record<
  EntityId,
  {
    parcel: EntityId;
    destination: EntityId;
  }
>;
```

Example:

```json
{
  "mina": { "parcel": "lantern", "destination": "garden" },
  "juno": { "parcel": "books", "destination": "library" },
  "sol": { "parcel": "cake", "destination": "bakery" }
}
```

Validity rules:

- every courier appears exactly once,
- every parcel appears exactly once,
- every destination appears exactly once,
- every referenced id exists in `entities`.

## Clue Type Enum

```ts
type ClueType =
  | 'courier_parcel_yes'
  | 'courier_parcel_no'
  | 'courier_destination_yes'
  | 'courier_destination_no'
  | 'parcel_destination_link'
  | 'parcel_destination_no'
  | 'courier_parcel_either'
  | 'courier_destination_either';
```

These map to the v0 allowed clue grammar:

| Schema Type | Spec Rule |
| --- | --- |
| `courier_parcel_yes` | Direct Yes |
| `courier_parcel_no` | Direct No |
| `courier_destination_yes` | Direct Yes |
| `courier_destination_no` | Direct No |
| `parcel_destination_link` | Parcel-Destination Link |
| `parcel_destination_no` | Parcel-Destination Exclusion |
| `courier_parcel_either` | Either-Or For One Courier |
| `courier_destination_either` | Either-Or For One Courier |

## Clue Shape

Every clue has:

```ts
type BaseClue = {
  id: string;
  text: string;
  type: ClueType;
};
```

Typed clue variants:

```ts
type CourierParcelYesClue = BaseClue & {
  type: 'courier_parcel_yes';
  courier: EntityId;
  parcel: EntityId;
};

type CourierParcelNoClue = BaseClue & {
  type: 'courier_parcel_no';
  courier: EntityId;
  parcel: EntityId;
};

type CourierDestinationYesClue = BaseClue & {
  type: 'courier_destination_yes';
  courier: EntityId;
  destination: EntityId;
};

type CourierDestinationNoClue = BaseClue & {
  type: 'courier_destination_no';
  courier: EntityId;
  destination: EntityId;
};

type ParcelDestinationLinkClue = BaseClue & {
  type: 'parcel_destination_link';
  parcel: EntityId;
  destination: EntityId;
};

type ParcelDestinationNoClue = BaseClue & {
  type: 'parcel_destination_no';
  parcel: EntityId;
  destination: EntityId;
};

type CourierParcelEitherClue = BaseClue & {
  type: 'courier_parcel_either';
  courier: EntityId;
  parcels: [EntityId, EntityId];
};

type CourierDestinationEitherClue = BaseClue & {
  type: 'courier_destination_either';
  courier: EntityId;
  destinations: [EntityId, EntityId];
};

type Clue =
  | CourierParcelYesClue
  | CourierParcelNoClue
  | CourierDestinationYesClue
  | CourierDestinationNoClue
  | ParcelDestinationLinkClue
  | ParcelDestinationNoClue
  | CourierParcelEitherClue
  | CourierDestinationEitherClue;
```

## Constraint Semantics

The validator checks complete assignment candidates.

A complete assignment candidate has the same shape as `SolutionManifest`.

### Base One-To-One Constraints

For every complete assignment:

- each courier has exactly one parcel,
- each courier has exactly one destination,
- no two couriers share a parcel,
- no two couriers share a destination.

### Clue Constraints

`courier_parcel_yes`

```ts
candidate[clue.courier].parcel === clue.parcel
```

`courier_parcel_no`

```ts
candidate[clue.courier].parcel !== clue.parcel
```

`courier_destination_yes`

```ts
candidate[clue.courier].destination === clue.destination
```

`courier_destination_no`

```ts
candidate[clue.courier].destination !== clue.destination
```

`parcel_destination_link`

```ts
for every courier:
  candidate[courier].parcel === clue.parcel
    iff candidate[courier].destination === clue.destination
```

This is intentionally bidirectional. If Books go to Library, the Library courier must be the Books courier.

`parcel_destination_no`

```ts
for every courier:
  not (
    candidate[courier].parcel === clue.parcel &&
    candidate[courier].destination === clue.destination
  )
```

`courier_parcel_either`

```ts
candidate[clue.courier].parcel in clue.parcels
```

`courier_destination_either`

```ts
candidate[clue.courier].destination in clue.destinations
```

## Mark State

Runtime player marks should be stored separately from puzzle data.

```ts
type CandidateMark = 'unknown' | 'no' | 'yes';

type PlayerMarks = {
  parcels: Record<EntityId, Record<EntityId, CandidateMark>>;
  destinations: Record<EntityId, Record<EntityId, CandidateMark>>;
};
```

Shape:

```text
marks.parcels[courierId][parcelId]
marks.destinations[courierId][destinationId]
```

Rules:

- Initial state is all `unknown`.
- Marking `yes` in one row should imply `no` for peer cells in that category.
- Contradictions are computed from marks, not stored in puzzle data.

## Proof Trace

Proof trace is authored instructional data, not the solver's internal proof.

```ts
type ProofStep = {
  id: string;
  text: string;
  clueIds: string[];
  rule:
    | 'direct_yes'
    | 'direct_no'
    | 'one_to_one_elimination'
    | 'parcel_destination_link'
    | 'parcel_destination_no'
    | 'either_or'
    | 'remaining_candidate'
    | 'contradiction';
  marks?: ProofMark[];
};

type ProofMark = {
  kind: 'yes' | 'no';
  category: 'parcel' | 'destination';
  courier: EntityId;
  item: EntityId;
};
```

Guidance:

- `clueIds` may be empty only for pure one-to-one remaining-candidate steps.
- `marks` lists the intended visible deduction, when applicable.
- The proof trace does not need to include every automatic peer elimination.

## Validator Expectations

The reusable validator should expose these functions or equivalent behavior:

```ts
validatePuzzleShape(puzzle: Puzzle): ValidationIssue[];
enumerateSolutions(puzzle: Puzzle): SolutionManifest[];
hasUniqueSolution(puzzle: Puzzle): boolean;
checkSolution(puzzle: Puzzle, solution: SolutionManifest): boolean;
```

### `validatePuzzleShape`

Checks:

- all ids are unique within category,
- every clue id is unique,
- every clue reference exists,
- either-or arrays contain exactly two distinct ids,
- solution references valid ids,
- solution uses every parcel and destination exactly once,
- proof steps reference known clue ids.

### `enumerateSolutions`

Expected behavior:

- generate every parcel permutation,
- generate every destination permutation,
- combine them into complete candidate manifests,
- apply base one-to-one constraints,
- apply all clue constraints,
- return candidates that satisfy all constraints.

For v0 scale, brute force is acceptable:

- 3x3: `3! * 3! = 36` candidates,
- 4x4: `4! * 4! = 576` candidates.

### `hasUniqueSolution`

Expected behavior:

```ts
enumerateSolutions(puzzle).length === 1
```

### `checkSolution`

Expected behavior:

- verify the submitted solution satisfies all constraints,
- optionally compare with the unique enumerated solution for exact match.

## Example Encoding: Puzzle 1

This is the schema version of `Puzzle 1: First Board` from the prototype spec.

```json
{
  "id": "first-board",
  "title": "First Board",
  "version": "0.1",
  "difficulty": "tutorial",
  "learningGoal": [
    "Teach one-to-one assignment.",
    "Teach Direct Yes and Direct No."
  ],
  "rulesBeforePlay": [
    "Each courier gets one parcel and one destination.",
    "Each parcel and destination can be used once.",
    "A direct is clue confirms a candidate.",
    "A direct is not clue removes a candidate."
  ],
  "entities": {
    "couriers": [
      { "id": "mina", "label": "Mina" },
      { "id": "juno", "label": "Juno" },
      { "id": "sol", "label": "Sol" }
    ],
    "parcels": [
      { "id": "lantern", "label": "Lantern" },
      { "id": "books", "label": "Books" },
      { "id": "cake", "label": "Cake" }
    ],
    "destinations": [
      { "id": "library", "label": "Library" },
      { "id": "bakery", "label": "Bakery" },
      { "id": "garden", "label": "Garden" }
    ]
  },
  "clues": [
    {
      "id": "c1",
      "type": "courier_parcel_yes",
      "text": "Mina carries the Lantern.",
      "courier": "mina",
      "parcel": "lantern"
    },
    {
      "id": "c2",
      "type": "courier_destination_no",
      "text": "Juno is not going to the Garden.",
      "courier": "juno",
      "destination": "garden"
    },
    {
      "id": "c3",
      "type": "courier_parcel_yes",
      "text": "Sol carries the Cake.",
      "courier": "sol",
      "parcel": "cake"
    },
    {
      "id": "c4",
      "type": "parcel_destination_link",
      "text": "The courier with the Books goes to the Library.",
      "parcel": "books",
      "destination": "library"
    },
    {
      "id": "c5",
      "type": "courier_destination_no",
      "text": "Mina is not going to the Bakery.",
      "courier": "mina",
      "destination": "bakery"
    }
  ],
  "solution": {
    "mina": { "parcel": "lantern", "destination": "garden" },
    "juno": { "parcel": "books", "destination": "library" },
    "sol": { "parcel": "cake", "destination": "bakery" }
  },
  "proofTrace": [
    {
      "id": "p1",
      "text": "Mina carries Lantern.",
      "clueIds": ["c1"],
      "rule": "direct_yes",
      "marks": [
        { "kind": "yes", "category": "parcel", "courier": "mina", "item": "lantern" }
      ]
    },
    {
      "id": "p2",
      "text": "Sol carries Cake.",
      "clueIds": ["c3"],
      "rule": "direct_yes",
      "marks": [
        { "kind": "yes", "category": "parcel", "courier": "sol", "item": "cake" }
      ]
    },
    {
      "id": "p3",
      "text": "By one-to-one parcels, Juno must carry Books.",
      "clueIds": [],
      "rule": "remaining_candidate",
      "marks": [
        { "kind": "yes", "category": "parcel", "courier": "juno", "item": "books" }
      ]
    },
    {
      "id": "p4",
      "text": "Books go to Library, so Juno goes Library.",
      "clueIds": ["c4"],
      "rule": "parcel_destination_link",
      "marks": [
        { "kind": "yes", "category": "destination", "courier": "juno", "item": "library" }
      ]
    },
    {
      "id": "p5",
      "text": "Mina is not Bakery.",
      "clueIds": ["c5"],
      "rule": "direct_no",
      "marks": [
        { "kind": "no", "category": "destination", "courier": "mina", "item": "bakery" }
      ]
    },
    {
      "id": "p6",
      "text": "Mina cannot be Bakery, so Mina goes Garden and Sol goes Bakery.",
      "clueIds": ["c5"],
      "rule": "remaining_candidate",
      "marks": [
        { "kind": "yes", "category": "destination", "courier": "mina", "item": "garden" },
        { "kind": "yes", "category": "destination", "courier": "sol", "item": "bakery" }
      ]
    }
  ]
}
```

## Implementation Acceptance Criteria

A prototype data layer satisfies this schema if:

- every puzzle is represented with `Puzzle`,
- every clue uses one of the v0 clue types,
- every clue reference is validated before play,
- `enumerateSolutions` returns exactly one solution for every shipped v0 puzzle,
- player marks are stored separately from puzzle definitions,
- proof trace ids can be mapped to visible hints,
- no route/path/time data is added to v0 puzzle definitions.

## Ambiguity Audit

Verdict: Ready With Assumptions

Score: 4/5

Blocking ambiguities:

- None for a data-schema implementation.

Risky ambiguities:

- The proof trace is authored and may not match a future automated solver's deduction order.
- The schema stores clue text directly; future localization may require separating text templates from clue payloads.
- The runtime contradiction model is described behaviorally, not as a concrete algorithm.

Assumptions that would make this implementable:

- v0 uses brute-force uniqueness checking because puzzle size is at most 4x4.
- clue text remains hand-authored English/Korean copy for the prototype.
- proof traces are tutorial/hint content, not formal machine-generated proofs.
- forced marks are suggested to the player rather than auto-applied.

Clarifying questions before code:

- Should the first implementation store puzzle definitions in TypeScript modules or JSON files?
- Should clue text be English-only initially, Korean-only, or bilingual fields?
- Should proof trace steps be required for every puzzle before it can ship in the prototype?

Implementation readiness:

- Scope: clear for puzzle data and validation.
- Inputs/outputs: clear puzzle input, solution output, and validation issue output.
- State/data: clear for puzzle definitions and player marks.
- UX/API behavior: enough for data-layer implementation; UI integration still needs separate spec.
- Validation: clear; enumerate all complete candidates and require exactly one solution.
