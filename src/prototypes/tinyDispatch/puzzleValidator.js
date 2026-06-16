export const clueTypes = new Set([
  'courier_parcel_yes',
  'courier_parcel_no',
  'courier_destination_yes',
  'courier_destination_no',
  'parcel_destination_link',
  'parcel_destination_no',
  'courier_parcel_either',
  'courier_destination_either'
]);

export const proofRules = new Set([
  'direct_yes',
  'direct_no',
  'one_to_one_elimination',
  'parcel_destination_link',
  'parcel_destination_no',
  'either_or',
  'remaining_candidate',
  'contradiction'
]);

export function validatePuzzleShape(puzzle) {
  const issues = [];
  const add = (severity, code, message, path) => issues.push({ severity, code, message, path });

  if (!puzzle || typeof puzzle !== 'object') {
    add('error', 'invalid_puzzle', 'Puzzle must be an object');
    return issues;
  }

  const couriers = arrayAt(puzzle, 'entities.couriers');
  const parcels = arrayAt(puzzle, 'entities.parcels');
  const destinations = arrayAt(puzzle, 'entities.destinations');
  const clues = Array.isArray(puzzle.clues) ? puzzle.clues : [];
  const proofTrace = Array.isArray(puzzle.proofTrace) ? puzzle.proofTrace : [];
  const solution = isObject(puzzle.solution) ? puzzle.solution : {};

  if (!Array.isArray(puzzle.learningGoal) || puzzle.learningGoal.length === 0) {
    add('warning', 'empty_learning_goal', 'Puzzle should include at least one learning goal', 'learningGoal');
  }

  const courierIds = validateEntities(couriers, 'couriers', issues);
  const parcelIds = validateEntities(parcels, 'parcels', issues);
  const destinationIds = validateEntities(destinations, 'destinations', issues);
  const clueIds = new Set();

  clues.forEach((clue, index) => {
    const path = `clues[${index}]`;
    if (!isObject(clue)) {
      add('error', 'invalid_clue', 'Clue must be an object', path);
      return;
    }
    if (clueIds.has(clue.id)) {
      add('error', 'duplicate_clue_id', `Duplicate clue id: ${clue.id}`, `${path}.id`);
    }
    clueIds.add(clue.id);
    if (!clue.text) add('warning', 'empty_clue_text', `Clue ${clue.id ?? index} has empty text`, `${path}.text`);
    if (!clueTypes.has(clue.type)) {
      add('error', 'invalid_clue_type', `Invalid clue type: ${String(clue.type)}`, `${path}.type`);
      return;
    }
    validateClueReferences(clue, path, { courierIds, parcelIds, destinationIds, add });
  });

  validateSolution(solution, { courierIds, parcelIds, destinationIds, add });
  validateProofTrace(proofTrace, { clueIds, courierIds, parcelIds, destinationIds, add });

  return issues;
}

export function enumerateSolutions(puzzle) {
  const errors = validatePuzzleShape(puzzle).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(`Cannot enumerate invalid puzzle: ${errors.map((issue) => issue.code).join(', ')}`);
  }

  const couriers = puzzle.entities.couriers.map((entity) => entity.id);
  const parcels = puzzle.entities.parcels.map((entity) => entity.id);
  const destinations = puzzle.entities.destinations.map((entity) => entity.id);
  const solutions = [];

  for (const parcelPermutation of permutations(parcels)) {
    for (const destinationPermutation of permutations(destinations)) {
      const candidate = {};
      couriers.forEach((courier, index) => {
        candidate[courier] = {
          parcel: parcelPermutation[index],
          destination: destinationPermutation[index]
        };
      });
      if (puzzle.clues.every((clue) => satisfiesClue(candidate, clue))) {
        solutions.push(candidate);
      }
    }
  }

  return solutions;
}

export function hasUniqueSolution(puzzle) {
  return enumerateSolutions(puzzle).length === 1;
}

export function checkSolution(puzzle, solution) {
  const errors = validatePuzzleShape({ ...puzzle, solution }).filter((issue) => issue.severity === 'error');
  if (errors.length > 0) return false;
  return puzzle.clues.every((clue) => satisfiesClue(solution, clue));
}

export function satisfiesClue(candidate, clue) {
  switch (clue.type) {
    case 'courier_parcel_yes':
      return candidate[clue.courier].parcel === clue.parcel;
    case 'courier_parcel_no':
      return candidate[clue.courier].parcel !== clue.parcel;
    case 'courier_destination_yes':
      return candidate[clue.courier].destination === clue.destination;
    case 'courier_destination_no':
      return candidate[clue.courier].destination !== clue.destination;
    case 'parcel_destination_link':
      return Object.values(candidate).every(
        (assignment) => (assignment.parcel === clue.parcel) === (assignment.destination === clue.destination)
      );
    case 'parcel_destination_no':
      return Object.values(candidate).every(
        (assignment) => !(assignment.parcel === clue.parcel && assignment.destination === clue.destination)
      );
    case 'courier_parcel_either':
      return clue.parcels.includes(candidate[clue.courier].parcel);
    case 'courier_destination_either':
      return clue.destinations.includes(candidate[clue.courier].destination);
    default:
      return false;
  }
}

function validateEntities(entities, category, issues) {
  const ids = new Set();
  const add = (severity, code, message, path) => issues.push({ severity, code, message, path });
  if (!Array.isArray(entities)) return ids;

  entities.forEach((entity, index) => {
    const path = `entities.${category}[${index}].id`;
    if (!entity?.id) return;
    if (ids.has(entity.id)) {
      add('error', 'duplicate_entity_id', `Duplicate ${category} id: ${entity.id}`, path);
    }
    ids.add(entity.id);
  });

  return ids;
}

function validateClueReferences(clue, path, context) {
  const { courierIds, parcelIds, destinationIds, add } = context;
  if ('courier' in clue) validateId(courierIds, clue.courier, 'unknown_courier_id', `${path}.courier`, add);
  if ('parcel' in clue) validateId(parcelIds, clue.parcel, 'unknown_parcel_id', `${path}.parcel`, add);
  if ('destination' in clue) {
    validateId(destinationIds, clue.destination, 'unknown_destination_id', `${path}.destination`, add);
  }
  if ('parcels' in clue) {
    validateEitherArray(clue.parcels, parcelIds, 'parcel', `${path}.parcels`, add);
  }
  if ('destinations' in clue) {
    validateEitherArray(clue.destinations, destinationIds, 'destination', `${path}.destinations`, add);
  }
}

function validateEitherArray(values, validIds, category, path, add) {
  if (!Array.isArray(values) || values.length !== 2) {
    add('error', 'invalid_either_arity', `Either clue must contain exactly two ${category} ids`, path);
    return;
  }
  if (values[0] === values[1]) {
    add('error', 'duplicate_either_option', `Either clue repeats ${values[0]}`, path);
  }
  values.forEach((id, index) => {
    const code = category === 'parcel' ? 'unknown_parcel_id' : 'unknown_destination_id';
    validateId(validIds, id, code, `${path}[${index}]`, add);
  });
}

function validateSolution(solution, context) {
  const { courierIds, parcelIds, destinationIds, add } = context;
  const usedParcels = new Map();
  const usedDestinations = new Map();

  courierIds.forEach((courier) => {
    if (!Object.prototype.hasOwnProperty.call(solution, courier)) {
      add('error', 'solution_missing_courier', `Solution is missing courier ${courier}`, `solution.${courier}`);
      return;
    }
    const assignment = solution[courier];
    if (!isObject(assignment)) return;
    validateId(parcelIds, assignment.parcel, 'unknown_parcel_id', `solution.${courier}.parcel`, add);
    validateId(destinationIds, assignment.destination, 'unknown_destination_id', `solution.${courier}.destination`, add);
    trackReuse(usedParcels, assignment.parcel, courier, 'solution_reuses_parcel', add);
    trackReuse(usedDestinations, assignment.destination, courier, 'solution_reuses_destination', add);
  });

  Object.keys(solution).forEach((courier) => {
    if (!courierIds.has(courier)) {
      add('error', 'solution_extra_courier', `Solution includes unknown courier ${courier}`, `solution.${courier}`);
    }
  });
}

function validateProofTrace(proofTrace, context) {
  const { clueIds, courierIds, parcelIds, destinationIds, add } = context;
  proofTrace.forEach((step, stepIndex) => {
    const path = `proofTrace[${stepIndex}]`;
    if (!proofRules.has(step.rule)) {
      add('error', 'invalid_proof_rule', `Invalid proof rule: ${String(step.rule)}`, `${path}.rule`);
    }
    (Array.isArray(step.clueIds) ? step.clueIds : []).forEach((clueId, clueIndex) => {
      if (!clueIds.has(clueId)) {
        add('error', 'unknown_proof_clue_id', `Proof step references unknown clue ${clueId}`, `${path}.clueIds[${clueIndex}]`);
      }
    });
    (Array.isArray(step.marks) ? step.marks : []).forEach((mark, markIndex) => {
      const markPath = `${path}.marks[${markIndex}]`;
      validateId(courierIds, mark.courier, 'unknown_courier_id', `${markPath}.courier`, add);
      if (mark.category === 'parcel') validateId(parcelIds, mark.item, 'unknown_parcel_id', `${markPath}.item`, add);
      if (mark.category === 'destination') {
        validateId(destinationIds, mark.item, 'unknown_destination_id', `${markPath}.item`, add);
      }
    });
  });
}

function validateId(validIds, id, code, path, add) {
  if (!validIds.has(id)) add('error', code, `Unknown id: ${String(id)}`, path);
}

function trackReuse(map, id, courier, code, add) {
  if (!id) return;
  if (map.has(id)) {
    add('error', code, `${id} is assigned to multiple couriers`, `solution.${courier}`);
  }
  map.set(id, courier);
}

function permutations(values) {
  if (values.length === 0) return [[]];
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((rest) => [value, ...rest])
  );
}

function arrayAt(object, path) {
  const value = path.split('.').reduce((current, part) => current?.[part], object);
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
