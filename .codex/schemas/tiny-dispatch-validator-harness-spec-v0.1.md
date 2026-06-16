# Tiny Dispatch Validator Harness Spec v0.1

## Purpose

This document defines the validation harness required before implementing a playable `Tiny Dispatch` prototype.

The harness must prove that puzzle data follows the v0.1 schema, that clue constraints are applied consistently, and that shipped puzzles have exactly one solution.

Related artifacts:

- `.codex/schemas/tiny-dispatch-puzzle-data-schema-v0.1.md`
- `.codex/blueprints/tiny-dispatch-prototype-spec-v0.1.md`

## Scope

Included:

- pure data validation,
- brute-force solution enumeration,
- constraint semantics tests,
- negative fixture tests,
- proof-trace reference checks,
- acceptance criteria for moving to UI implementation.

Excluded:

- Pixi or DOM UI,
- player input handling,
- hint presentation UI,
- generated puzzle authoring,
- analytics,
- route/pathfinding/time-ordering rules.

## Recommended File Scope

The first implementation may use any equivalent structure, but the preferred repo shape is:

```text
src/prototypes/tinyDispatch/
  puzzleTypes.ts
  puzzleValidator.ts
  puzzleFixtures.ts
  puzzleValidator.test.ts
```

If the project does not add a test runner yet, a Node script is acceptable:

```text
scripts/verify-tiny-dispatch-puzzles.cjs
```

Minimum acceptable command:

```text
npm run verify:tiny-dispatch
```

## Public API Contract

The validator module should expose these functions or exact equivalents:

```ts
type ValidationIssue = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
};

function validatePuzzleShape(puzzle: Puzzle): ValidationIssue[];

function enumerateSolutions(puzzle: Puzzle): SolutionManifest[];

function hasUniqueSolution(puzzle: Puzzle): boolean;

function checkSolution(puzzle: Puzzle, solution: SolutionManifest): boolean;
```

Behavior contract:

- `validatePuzzleShape` never throws for malformed puzzle-like input; it returns issues.
- `enumerateSolutions` may throw only if shape validation has errors and caller ignored them.
- `hasUniqueSolution` is equivalent to `enumerateSolutions(puzzle).length === 1`.
- `checkSolution` verifies base one-to-one constraints and all clue constraints.

## Required Validation Issues

The harness must detect these shape errors.

| Code | Severity | Trigger |
| --- | --- | --- |
| `duplicate_entity_id` | error | duplicate id inside a category |
| `duplicate_clue_id` | error | duplicate clue id |
| `unknown_courier_id` | error | clue, solution, or proof mark references missing courier |
| `unknown_parcel_id` | error | clue, solution, or proof mark references missing parcel |
| `unknown_destination_id` | error | clue, solution, or proof mark references missing destination |
| `invalid_clue_type` | error | clue type is not a v0 enum value |
| `invalid_either_arity` | error | either clue does not contain exactly two ids |
| `duplicate_either_option` | error | either clue repeats the same id twice |
| `solution_missing_courier` | error | solution lacks a courier row |
| `solution_extra_courier` | error | solution includes a non-existent courier |
| `solution_reuses_parcel` | error | solution assigns one parcel to multiple couriers |
| `solution_reuses_destination` | error | solution assigns one destination to multiple couriers |
| `unknown_proof_clue_id` | error | proof step references a missing clue |
| `invalid_proof_rule` | error | proof rule is not in the schema enum |
| `empty_clue_text` | warning | clue text is empty |
| `empty_learning_goal` | warning | learning goal is missing or empty |

The first version can add more issue codes, but it should not omit these.

## Constraint Semantics Tests

The harness must include at least one positive and one negative test for each clue type.

### `courier_parcel_yes`

Positive:

- candidate has Mina -> Lantern.

Negative:

- candidate has Mina -> Books.

### `courier_parcel_no`

Positive:

- candidate has Mina -> Books when clue says Mina is not Lantern.

Negative:

- candidate has Mina -> Lantern when clue says Mina is not Lantern.

### `courier_destination_yes`

Positive:

- candidate has Juno -> Library.

Negative:

- candidate has Juno -> Harbor.

### `courier_destination_no`

Positive:

- candidate has Juno -> Harbor when clue says Juno is not Library.

Negative:

- candidate has Juno -> Library when clue says Juno is not Library.

### `parcel_destination_link`

Positive:

- Books courier is also Library courier.

Negative:

- Books courier is Bakery courier while another courier is Library.

Bidirectional check:

- If a courier is Library, that same courier must carry Books.

### `parcel_destination_no`

Positive:

- Cake courier is Library.

Negative:

- Cake courier is Harbor when clue says Cake is not Harbor.

### `courier_parcel_either`

Positive:

- Mina carries Lantern or Books.

Negative:

- Mina carries Cake.

### `courier_destination_either`

Positive:

- Mina goes Library or Garden.

Negative:

- Mina goes Harbor.

## Enumeration Tests

The harness must test the number of generated candidates before and after clues.

### Empty 3x3

Input:

- 3 couriers,
- 3 parcels,
- 3 destinations,
- no clues.

Expected:

```text
3! * 3! = 36 solutions
```

### Empty 4x4

Input:

- 4 couriers,
- 4 parcels,
- 4 destinations,
- no clues.

Expected:

```text
4! * 4! = 576 solutions
```

### Puzzle 1 Schema Example

Input:

- `first-board` from `.codex/schemas/tiny-dispatch-puzzle-data-schema-v0.1.md`.

Expected:

```text
1 solution
```

Expected solution:

```json
{
  "mina": { "parcel": "lantern", "destination": "garden" },
  "juno": { "parcel": "books", "destination": "library" },
  "sol": { "parcel": "cake", "destination": "bakery" }
}
```

### Five Prototype-Spec Puzzles

Input:

- all five final puzzles from `.codex/blueprints/tiny-dispatch-prototype-spec-v0.1.md`, encoded as fixtures.

Expected:

```text
Puzzle 1: 1 solution
Puzzle 2: 1 solution
Puzzle 3: 1 solution
Puzzle 4: 1 solution
Puzzle 5: 1 solution
```

## Negative Fixture Tests

The harness must include explicit bad puzzles.

### Underconstrained Puzzle

Fixture:

- valid ids,
- no clues.

Expected:

- `validatePuzzleShape` returns no errors,
- `hasUniqueSolution` returns `false`,
- `enumerateSolutions` returns more than one solution.

### Contradictory Puzzle

Fixture:

- clue 1: Mina carries Lantern,
- clue 2: Mina does not carry Lantern.

Expected:

- `validatePuzzleShape` returns no errors,
- `hasUniqueSolution` returns `false`,
- `enumerateSolutions` returns zero solutions.

### Bad Reference Puzzle

Fixture:

- clue references courier `ghost-courier`.

Expected:

- `validatePuzzleShape` returns `unknown_courier_id`,
- enumeration is not attempted by the verification script.

### Invalid Either Puzzle

Fixture:

- clue type `courier_parcel_either`,
- `parcels: ["books", "books"]`.

Expected:

- `validatePuzzleShape` returns `duplicate_either_option`.

### Bad Solution Puzzle

Fixture:

- solution assigns `books` to two couriers.

Expected:

- `validatePuzzleShape` returns `solution_reuses_parcel`.

## Verification Script Behavior

`npm run verify:tiny-dispatch` should:

1. Load all v0 fixtures.
2. Run shape validation.
3. Fail if any fixture intended for play has validation errors.
4. Enumerate solutions for each playable fixture.
5. Fail if any playable fixture has anything other than one solution.
6. Run negative fixture tests.
7. Print a concise summary.

Example success output:

```text
Tiny Dispatch validator OK
playable fixtures: 5
negative fixtures: 5
solution counts: first-board=1, linked-parcel=1, either-or=1, negative-link=1, mixed-daily=1
```

Example failure output:

```text
Tiny Dispatch validator FAILED
fixture=bad-reference
issue=unknown_courier_id
path=clues[0].courier
```

## Performance Bound

V0 brute force is acceptable.

Acceptance target:

- all v0 verification should complete under 1 second on the current workspace for 3x3 and 4x4 fixtures.

Reason:

- 4x4 enumeration is only 576 candidate manifests before clue filtering.

## Implementation Acceptance Criteria

The harness implementation is acceptable when:

- `npm run verify:tiny-dispatch` exists,
- all public API functions are implemented or equivalent,
- all clue type semantics have positive and negative coverage,
- empty 3x3 returns 36 solutions,
- empty 4x4 returns 576 solutions,
- five playable fixtures each return one solution,
- underconstrained fixture returns multiple solutions,
- contradictory fixture returns zero solutions,
- malformed fixtures report expected validation issue codes,
- no UI code is required to run validation.

## Ambiguity Audit

Verdict: Ready With Assumptions

Score: 4/5

Blocking ambiguities:

- None for validator/harness implementation.

Risky ambiguities:

- Exact test framework is not fixed.
- Fixture storage format can be TypeScript modules or JSON files.
- Issue `path` formatting is not strictly specified beyond being useful.

Assumptions that would make this implementable:

- Use plain TypeScript modules plus a Node verification script if no test runner is added.
- Use brute-force enumeration for v0.
- Treat `ValidationIssue.code` values in this document as stable acceptance outputs.
- Keep proof trace validation shallow: references and enum validity only.

Clarifying questions before implementation:

- Should the repo add a test runner, or should `verify:tiny-dispatch` stay as a plain Node script?
- Should fixtures live under `src/prototypes/tinyDispatch/` or a separate `fixtures/` folder?

Implementation readiness:

- Scope: clear.
- Inputs/outputs: clear.
- State/data: clear; no persistent runtime state.
- UX/API behavior: clear for a data-layer harness; no UI behavior included.
- Validation: explicit and executable.

## Recommended Next Work Unit

Implement the validator harness, fixtures, and `npm run verify:tiny-dispatch`.

Do not start the playable UI until the harness passes.
