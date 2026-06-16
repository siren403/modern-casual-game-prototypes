const labels = {
  mina: 'Mina',
  juno: 'Juno',
  sol: 'Sol',
  rafi: 'Rafi',
  lantern: 'Lantern',
  books: 'Books',
  cake: 'Cake',
  seeds: 'Seeds',
  library: 'Library',
  bakery: 'Bakery',
  harbor: 'Harbor',
  garden: 'Garden'
};

const entity = (id) => ({ id, label: labels[id] ?? id });
const standardCouriers = ['mina', 'juno', 'sol', 'rafi'].map(entity);
const standardParcels = ['lantern', 'books', 'cake', 'seeds'].map(entity);
const standardDestinations = ['library', 'bakery', 'harbor', 'garden'].map(entity);

function puzzle(base) {
  return {
    version: '0.1',
    difficulty: 'tutorial',
    learningGoal: ['Validate Tiny Dispatch v0.1 rules.'],
    rulesBeforePlay: ['Each courier gets one parcel and one destination.'],
    proofTrace: [],
    ...base
  };
}

export const firstBoardPuzzle = puzzle({
  id: 'first-board',
  title: 'First Board',
  entities: {
    couriers: ['mina', 'juno', 'sol'].map(entity),
    parcels: ['lantern', 'books', 'cake'].map(entity),
    destinations: ['library', 'bakery', 'garden'].map(entity)
  },
  clues: [
    { id: 'c1', type: 'courier_parcel_yes', text: 'Mina carries the Lantern.', courier: 'mina', parcel: 'lantern' },
    {
      id: 'c2',
      type: 'courier_destination_no',
      text: 'Juno is not going to the Garden.',
      courier: 'juno',
      destination: 'garden'
    },
    { id: 'c3', type: 'courier_parcel_yes', text: 'Sol carries the Cake.', courier: 'sol', parcel: 'cake' },
    {
      id: 'c4',
      type: 'parcel_destination_link',
      text: 'The courier with the Books goes to the Library.',
      parcel: 'books',
      destination: 'library'
    },
    {
      id: 'c5',
      type: 'courier_destination_no',
      text: 'Mina is not going to the Bakery.',
      courier: 'mina',
      destination: 'bakery'
    }
  ],
  solution: {
    mina: { parcel: 'lantern', destination: 'garden' },
    juno: { parcel: 'books', destination: 'library' },
    sol: { parcel: 'cake', destination: 'bakery' }
  },
  proofTrace: [
    { id: 'p1', text: 'Mina carries Lantern.', clueIds: ['c1'], rule: 'direct_yes' },
    { id: 'p2', text: 'Sol carries Cake.', clueIds: ['c3'], rule: 'direct_yes' },
    { id: 'p3', text: 'Juno must carry Books.', clueIds: [], rule: 'remaining_candidate' },
    { id: 'p4', text: 'Books go Library.', clueIds: ['c4'], rule: 'parcel_destination_link' }
  ]
});

const standardEntities = {
  couriers: standardCouriers,
  parcels: standardParcels,
  destinations: standardDestinations
};

export const playablePuzzles = [
  firstBoardPuzzle,
  puzzle({
    id: 'linked-parcel',
    title: 'Linked Parcel',
    difficulty: 'easy',
    entities: standardEntities,
    clues: [
      { id: 'c1', type: 'parcel_destination_link', text: 'The Books go to the Library.', parcel: 'books', destination: 'library' },
      { id: 'c2', type: 'courier_parcel_yes', text: 'Mina carries the Cake.', courier: 'mina', parcel: 'cake' },
      { id: 'c3', type: 'parcel_destination_no', text: 'The Cake is not going to the Harbor.', parcel: 'cake', destination: 'harbor' },
      { id: 'c4', type: 'courier_destination_yes', text: 'Rafi is going to the Garden.', courier: 'rafi', destination: 'garden' },
      { id: 'c5', type: 'courier_parcel_no', text: 'Sol does not carry the Lantern.', courier: 'sol', parcel: 'lantern' },
      { id: 'c6', type: 'courier_parcel_no', text: 'Juno does not carry the Seeds.', courier: 'juno', parcel: 'seeds' },
      { id: 'c7', type: 'parcel_destination_no', text: 'The Seeds are not going to the Bakery.', parcel: 'seeds', destination: 'bakery' },
      { id: 'c8', type: 'courier_parcel_no', text: 'Rafi does not carry the Seeds.', courier: 'rafi', parcel: 'seeds' }
    ],
    solution: {
      mina: { parcel: 'cake', destination: 'bakery' },
      juno: { parcel: 'books', destination: 'library' },
      sol: { parcel: 'seeds', destination: 'harbor' },
      rafi: { parcel: 'lantern', destination: 'garden' }
    }
  }),
  puzzle({
    id: 'either-or',
    title: 'Either-Or',
    difficulty: 'medium',
    entities: standardEntities,
    clues: [
      { id: 'c1', type: 'courier_parcel_either', text: 'Mina carries either Lantern or Books.', courier: 'mina', parcels: ['lantern', 'books'] },
      { id: 'c2', type: 'courier_parcel_no', text: 'Mina does not carry the Lantern.', courier: 'mina', parcel: 'lantern' },
      { id: 'c3', type: 'parcel_destination_link', text: 'The Books go to the Bakery.', parcel: 'books', destination: 'bakery' },
      { id: 'c4', type: 'courier_parcel_yes', text: 'Juno carries the Cake.', courier: 'juno', parcel: 'cake' },
      { id: 'c5', type: 'parcel_destination_no', text: 'The Cake is not going to the Harbor.', parcel: 'cake', destination: 'harbor' },
      { id: 'c6', type: 'courier_destination_yes', text: 'Rafi is going to the Harbor.', courier: 'rafi', destination: 'harbor' },
      { id: 'c7', type: 'courier_parcel_no', text: 'Sol does not carry the Seeds.', courier: 'sol', parcel: 'seeds' },
      { id: 'c8', type: 'parcel_destination_link', text: 'The Lantern goes to the Garden.', parcel: 'lantern', destination: 'garden' }
    ],
    solution: {
      mina: { parcel: 'books', destination: 'bakery' },
      juno: { parcel: 'cake', destination: 'library' },
      sol: { parcel: 'lantern', destination: 'garden' },
      rafi: { parcel: 'seeds', destination: 'harbor' }
    }
  }),
  puzzle({
    id: 'negative-link',
    title: 'Negative Link',
    difficulty: 'medium',
    entities: standardEntities,
    clues: [
      { id: 'c1', type: 'courier_parcel_yes', text: 'Mina carries the Lantern.', courier: 'mina', parcel: 'lantern' },
      { id: 'c2', type: 'parcel_destination_no', text: 'The Lantern is not going to the Harbor.', parcel: 'lantern', destination: 'harbor' },
      { id: 'c3', type: 'courier_destination_yes', text: 'Juno is going to the Harbor.', courier: 'juno', destination: 'harbor' },
      { id: 'c4', type: 'parcel_destination_link', text: 'The Books go to the Library.', parcel: 'books', destination: 'library' },
      { id: 'c5', type: 'courier_parcel_no', text: 'Sol does not carry the Cake.', courier: 'sol', parcel: 'cake' },
      { id: 'c6', type: 'courier_parcel_no', text: 'Rafi does not carry the Seeds.', courier: 'rafi', parcel: 'seeds' },
      { id: 'c7', type: 'parcel_destination_no', text: 'The Seeds are not going to the Bakery.', parcel: 'seeds', destination: 'bakery' },
      { id: 'c8', type: 'courier_destination_no', text: 'Mina is not going to the Bakery.', courier: 'mina', destination: 'bakery' }
    ],
    solution: {
      mina: { parcel: 'lantern', destination: 'garden' },
      juno: { parcel: 'seeds', destination: 'harbor' },
      sol: { parcel: 'books', destination: 'library' },
      rafi: { parcel: 'cake', destination: 'bakery' }
    }
  }),
  puzzle({
    id: 'mixed-daily',
    title: 'Mixed Daily Sample',
    difficulty: 'hard',
    entities: standardEntities,
    clues: [
      { id: 'c1', type: 'courier_parcel_yes', text: 'Sol carries the Books.', courier: 'sol', parcel: 'books' },
      { id: 'c2', type: 'parcel_destination_link', text: 'The Books go to the Library.', parcel: 'books', destination: 'library' },
      { id: 'c3', type: 'courier_parcel_either', text: 'Mina carries either Lantern or Seeds.', courier: 'mina', parcels: ['lantern', 'seeds'] },
      { id: 'c4', type: 'courier_parcel_no', text: 'Mina does not carry the Lantern.', courier: 'mina', parcel: 'lantern' },
      { id: 'c5', type: 'parcel_destination_link', text: 'The Seeds go to the Garden.', parcel: 'seeds', destination: 'garden' },
      { id: 'c6', type: 'courier_destination_yes', text: 'Rafi is going to the Harbor.', courier: 'rafi', destination: 'harbor' },
      { id: 'c7', type: 'parcel_destination_no', text: 'The Cake is not going to the Harbor.', parcel: 'cake', destination: 'harbor' },
      { id: 'c8', type: 'courier_destination_no', text: 'Juno is not going to the Garden.', courier: 'juno', destination: 'garden' }
    ],
    solution: {
      mina: { parcel: 'seeds', destination: 'garden' },
      juno: { parcel: 'cake', destination: 'bakery' },
      sol: { parcel: 'books', destination: 'library' },
      rafi: { parcel: 'lantern', destination: 'harbor' }
    }
  })
];

export const empty3x3Puzzle = puzzle({
  id: 'empty-3x3',
  title: 'Empty 3x3',
  entities: firstBoardPuzzle.entities,
  clues: [],
  solution: firstBoardPuzzle.solution
});

export const empty4x4Puzzle = puzzle({
  id: 'empty-4x4',
  title: 'Empty 4x4',
  entities: standardEntities,
  clues: [],
  solution: playablePuzzles[1].solution
});

export const negativeFixtures = {
  underconstrained: empty3x3Puzzle,
  contradictory: puzzle({
    id: 'contradictory',
    title: 'Contradictory',
    entities: firstBoardPuzzle.entities,
    clues: [
      { id: 'c1', type: 'courier_parcel_yes', text: 'Mina carries the Lantern.', courier: 'mina', parcel: 'lantern' },
      { id: 'c2', type: 'courier_parcel_no', text: 'Mina does not carry the Lantern.', courier: 'mina', parcel: 'lantern' }
    ],
    solution: firstBoardPuzzle.solution
  }),
  badReference: puzzle({
    id: 'bad-reference',
    title: 'Bad Reference',
    entities: firstBoardPuzzle.entities,
    clues: [
      { id: 'c1', type: 'courier_parcel_yes', text: 'Ghost carries the Lantern.', courier: 'ghost-courier', parcel: 'lantern' }
    ],
    solution: firstBoardPuzzle.solution
  }),
  invalidEither: puzzle({
    id: 'invalid-either',
    title: 'Invalid Either',
    entities: firstBoardPuzzle.entities,
    clues: [
      { id: 'c1', type: 'courier_parcel_either', text: 'Mina carries either Books or Books.', courier: 'mina', parcels: ['books', 'books'] }
    ],
    solution: firstBoardPuzzle.solution
  }),
  badSolution: puzzle({
    id: 'bad-solution',
    title: 'Bad Solution',
    entities: firstBoardPuzzle.entities,
    clues: firstBoardPuzzle.clues,
    solution: {
      mina: { parcel: 'books', destination: 'garden' },
      juno: { parcel: 'books', destination: 'library' },
      sol: { parcel: 'cake', destination: 'bakery' }
    }
  })
};
