# Tiny Dispatch Paper-To-Playable Mapping v0.1

## Purpose

This document maps the current `Tiny Dispatch` paper rules, fixtures, and validator into a deployable sample-game UI.

It is a bridge artifact. It should be used before implementation so the playable prototype does not invent UI rules that conflict with the validated puzzle model.

## Target

Build a deployable sample game with:

- 5 validated puzzles,
- mobile-friendly deduction board,
- Korean player-facing copy,
- playable marking interactions,
- hint/proof support,
- completion check,
- GitHub Pages deployment.

The target is a sample game, not a finished commercial product.

## Implementation Choice

Use DOM for `Tiny Dispatch` v0.1.

Reason:

- The core interaction is reading clues and marking a logic board.
- Text, focus, buttons, and table-like state are better served by DOM than canvas.
- The previous Pixi shell lessons still apply as validation pressure: no accidental horizontal overflow, no unusable mobile layout, and no gameplay-critical text hidden offscreen.

Do not use Pixi for this prototype unless the game later adds spatial/animated interactions that DOM cannot comfortably express.

## Route And Registry

Add a new route:

```text
#/tiny-dispatch
```

Add a new prototype registry entry:

```text
id: tiny-dispatch
title: 타이니 디스패치
type: hypothetical concept
status: 배포 가능한 샘플 게임
```

The home page should list both:

- `서킷 스케치` as a stopped/probe-like prior prototype,
- `타이니 디스패치` as the active sample game.

## Screen Structure

### Header

Visible fields:

- game title,
- puzzle number and title,
- difficulty,
- progress summary,
- build id.

Required actions:

- 목록,
- 이전 퍼즐,
- 다음 퍼즐,
- 리셋.

### Rule Strip

Shown near the top of each puzzle.

Content:

- `rulesBeforePlay` from fixture,
- learning goal summary.

Behavior:

- visible by default for Puzzle 1,
- collapsible for later puzzles if screen height is tight,
- never required to scroll horizontally.

### Clue List

Each clue card shows:

- clue number,
- Korean clue text,
- optional selected state when referenced by hint.

Behavior:

- tapping a clue highlights it,
- hint can highlight the next relevant clue.

### Logic Board

Rows:

- couriers.

Sections:

- parcel candidates,
- destination candidates.

Each candidate cell:

- cycles `unknown -> no -> yes -> unknown`,
- may also support direct mode buttons later, but cycle is enough for v0.1.

Visual states:

| State | Display |
| --- | --- |
| Unknown | blank / pale cell |
| No | X mark |
| Yes | check mark / filled cell |
| Contradiction | red outline |
| Auto-eliminated peer | same as No, but no separate source tracking required in v0.1 |

### Hint Panel

Uses `proofTrace`.

Behavior:

- `힌트` advances one proof step at a time.
- A hint shows proof step text and referenced clue ids.
- If `marks` are present later, highlighted target cells should be supported.
- Current fixtures have minimal proof traces; v0.1 can show text-only hints for puzzles with sparse traces.

### Completion Panel

Shown when every courier has one `Yes` parcel and one `Yes` destination and the assignment passes `checkSolution`.

Content:

- solved manifest,
- success message,
- next puzzle button.

If submitted assignment is complete but wrong:

- show a short failure message,
- do not reveal the answer,
- highlight contradiction if detectable.

## State Mapping

### Puzzle Data

Source:

```text
playablePuzzles
```

from:

```text
src/prototypes/tinyDispatch/puzzleFixtures.js
```

### Runtime Marks

Use:

```ts
type CandidateMark = 'unknown' | 'no' | 'yes';
```

Shape:

```text
marks.parcels[courierId][parcelId]
marks.destinations[courierId][destinationId]
```

Initial state:

- every candidate is `unknown`.

### Cell Cycle

On tap:

```text
unknown -> no -> yes -> unknown
```

When a cell becomes `yes`:

- peer cells in the same courier/category become `no`,
- same item for other couriers becomes `no`.

When a `yes` is cleared:

- v0.1 may recompute peer eliminations from remaining `yes` marks,
- this avoids source-tracking complexity.

### Completion Candidate

A manifest is complete when:

- every courier has exactly one `yes` parcel,
- every courier has exactly one `yes` destination.

Then call:

```text
checkSolution(puzzle, manifest)
```

If true:

- mark puzzle complete.

If false:

- show failure feedback.

## Copy Direction

Use Korean for player-facing UI.

Data fixtures may remain English ids/labels for now, but UI labels should be mapped to Korean display names before deployment.

Initial display label mapping:

| ID | Korean |
| --- | --- |
| mina | 미나 |
| juno | 주노 |
| sol | 솔 |
| rafi | 라피 |
| lantern | 랜턴 |
| books | 책 |
| cake | 케이크 |
| seeds | 씨앗 |
| library | 도서관 |
| bakery | 빵집 |
| harbor | 항구 |
| garden | 정원 |

Puzzle names:

| ID | Korean |
| --- | --- |
| first-board | 첫 배달 |
| linked-parcel | 목적지가 정해진 소포 |
| either-or | 둘 중 하나 |
| negative-link | 갈 수 없는 목적지 |
| mixed-daily | 오늘의 배차 |

## Validation Gates

Before local playable claim:

- `npm run verify:tiny-dispatch`
- `npm run build`
- mobile viewport manual or Playwright smoke check:
  - route loads,
  - no horizontal overflow at 390px width,
  - cells are tappable,
  - Puzzle 1 can be completed,
  - wrong complete assignment shows failure,
  - reset clears marks.

Before deployment claim:

- push/reflect Pages repo,
- GitHub Actions deploy succeeds,
- public URL route loads,
- public route build id matches latest Pages commit,
- same smoke check passes against public URL.

## Open UX Decisions

These are implementation choices, not blockers:

- whether clue list sits above or below board on small screens,
- whether hint panel is inline or sticky,
- exact color palette,
- whether completion auto-detects immediately or uses a `확인` button.

Default for v0.1:

- use an explicit `확인` button.

Reason:

- player can mark notes without premature failure feedback.

## Implementation Acceptance Criteria

The sample game is ready for deployment when:

- `#/tiny-dispatch` exists,
- home page links to it,
- five puzzles are selectable,
- Puzzle 1 includes visible rule explanation,
- marks work for parcel and destination cells,
- peer elimination works after `yes`,
- reset works,
- hint shows at least text proof steps,
- complete correct assignment succeeds,
- complete wrong assignment fails without revealing answer,
- `npm run verify:tiny-dispatch` passes,
- `npm run build` passes,
- deployed Pages URL is verified.

## Next Work Unit

Implement the DOM sample game route for `Tiny Dispatch`.

Do not deploy until local build and smoke validation pass.
