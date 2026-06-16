const { pathToFileURL } = require('url');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const root = process.cwd();
  const validator = await import(pathToFileURL(`${root}/src/prototypes/tinyDispatch/puzzleValidator.js`));
  const fixtures = await import(pathToFileURL(`${root}/src/prototypes/tinyDispatch/puzzleFixtures.js`));
  const {
    validatePuzzleShape,
    enumerateSolutions,
    hasUniqueSolution,
    checkSolution,
    satisfiesClue
  } = validator;
  const { playablePuzzles, empty3x3Puzzle, empty4x4Puzzle, negativeFixtures } = fixtures;

  const summary = [];

  assert(enumerateSolutions(empty3x3Puzzle).length === 36, 'empty 3x3 should have 36 solutions');
  assert(enumerateSolutions(empty4x4Puzzle).length === 576, 'empty 4x4 should have 576 solutions');

  runClueSemanticsChecks(satisfiesClue);

  playablePuzzles.forEach((puzzle) => {
    const issues = validatePuzzleShape(puzzle);
    const errors = issues.filter((issue) => issue.severity === 'error');
    assert(errors.length === 0, `${puzzle.id} has validation errors: ${JSON.stringify(errors)}`);
    const solutions = enumerateSolutions(puzzle);
    assert(solutions.length === 1, `${puzzle.id} should have 1 solution, got ${solutions.length}`);
    assert(hasUniqueSolution(puzzle), `${puzzle.id} should be unique`);
    assert(checkSolution(puzzle, puzzle.solution), `${puzzle.id} solution should satisfy clues`);
    summary.push(`${puzzle.id}=1`);
  });

  assert(hasUniqueSolution(negativeFixtures.underconstrained) === false, 'underconstrained fixture should not be unique');
  assert(
    enumerateSolutions(negativeFixtures.underconstrained).length > 1,
    'underconstrained fixture should have multiple solutions'
  );

  assert(hasUniqueSolution(negativeFixtures.contradictory) === false, 'contradictory fixture should not be unique');
  assert(enumerateSolutions(negativeFixtures.contradictory).length === 0, 'contradictory fixture should have zero solutions');

  expectIssue(negativeFixtures.badReference, 'unknown_courier_id');
  expectIssue(negativeFixtures.invalidEither, 'duplicate_either_option');
  expectIssue(negativeFixtures.badSolution, 'solution_reuses_parcel');

  console.log('Tiny Dispatch validator OK');
  console.log(`playable fixtures: ${playablePuzzles.length}`);
  console.log(`negative fixtures: ${Object.keys(negativeFixtures).length}`);
  console.log(`solution counts: ${summary.join(', ')}`);

  function expectIssue(puzzle, code) {
    const issues = validatePuzzleShape(puzzle);
    assert(issues.some((issue) => issue.code === code), `${puzzle.id} should report ${code}: ${JSON.stringify(issues)}`);
  }
}

function runClueSemanticsChecks(satisfiesClue) {
  const base = {
    mina: { parcel: 'lantern', destination: 'library' },
    juno: { parcel: 'books', destination: 'bakery' },
    sol: { parcel: 'cake', destination: 'harbor' }
  };

  assert(satisfiesClue(base, { type: 'courier_parcel_yes', courier: 'mina', parcel: 'lantern' }), 'courier_parcel_yes positive');
  assert(!satisfiesClue(base, { type: 'courier_parcel_yes', courier: 'mina', parcel: 'books' }), 'courier_parcel_yes negative');
  assert(satisfiesClue(base, { type: 'courier_parcel_no', courier: 'mina', parcel: 'books' }), 'courier_parcel_no positive');
  assert(!satisfiesClue(base, { type: 'courier_parcel_no', courier: 'mina', parcel: 'lantern' }), 'courier_parcel_no negative');
  assert(satisfiesClue(base, { type: 'courier_destination_yes', courier: 'juno', destination: 'bakery' }), 'courier_destination_yes positive');
  assert(!satisfiesClue(base, { type: 'courier_destination_yes', courier: 'juno', destination: 'harbor' }), 'courier_destination_yes negative');
  assert(satisfiesClue(base, { type: 'courier_destination_no', courier: 'juno', destination: 'harbor' }), 'courier_destination_no positive');
  assert(!satisfiesClue(base, { type: 'courier_destination_no', courier: 'juno', destination: 'bakery' }), 'courier_destination_no negative');
  assert(satisfiesClue(base, { type: 'parcel_destination_link', parcel: 'books', destination: 'bakery' }), 'parcel_destination_link positive');
  assert(!satisfiesClue(base, { type: 'parcel_destination_link', parcel: 'books', destination: 'library' }), 'parcel_destination_link negative');
  assert(satisfiesClue(base, { type: 'parcel_destination_no', parcel: 'cake', destination: 'library' }), 'parcel_destination_no positive');
  assert(!satisfiesClue(base, { type: 'parcel_destination_no', parcel: 'cake', destination: 'harbor' }), 'parcel_destination_no negative');
  assert(satisfiesClue(base, { type: 'courier_parcel_either', courier: 'mina', parcels: ['lantern', 'books'] }), 'courier_parcel_either positive');
  assert(!satisfiesClue(base, { type: 'courier_parcel_either', courier: 'mina', parcels: ['cake', 'books'] }), 'courier_parcel_either negative');
  assert(satisfiesClue(base, { type: 'courier_destination_either', courier: 'mina', destinations: ['library', 'garden'] }), 'courier_destination_either positive');
  assert(!satisfiesClue(base, { type: 'courier_destination_either', courier: 'mina', destinations: ['harbor', 'garden'] }), 'courier_destination_either negative');
}

main().catch((error) => {
  console.error('Tiny Dispatch validator FAILED');
  console.error(error);
  process.exit(1);
});
