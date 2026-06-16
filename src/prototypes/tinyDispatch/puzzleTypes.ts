export type EntityId = string;

export type Entity = {
  id: EntityId;
  label: string;
};

export type PuzzleDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

export type CandidateMark = 'unknown' | 'no' | 'yes';

export type ClueType =
  | 'courier_parcel_yes'
  | 'courier_parcel_no'
  | 'courier_destination_yes'
  | 'courier_destination_no'
  | 'parcel_destination_link'
  | 'parcel_destination_no'
  | 'courier_parcel_either'
  | 'courier_destination_either';

export type BaseClue = {
  id: string;
  text: string;
  type: ClueType;
};

export type Clue =
  | (BaseClue & { type: 'courier_parcel_yes'; courier: EntityId; parcel: EntityId })
  | (BaseClue & { type: 'courier_parcel_no'; courier: EntityId; parcel: EntityId })
  | (BaseClue & { type: 'courier_destination_yes'; courier: EntityId; destination: EntityId })
  | (BaseClue & { type: 'courier_destination_no'; courier: EntityId; destination: EntityId })
  | (BaseClue & { type: 'parcel_destination_link'; parcel: EntityId; destination: EntityId })
  | (BaseClue & { type: 'parcel_destination_no'; parcel: EntityId; destination: EntityId })
  | (BaseClue & { type: 'courier_parcel_either'; courier: EntityId; parcels: [EntityId, EntityId] })
  | (BaseClue & {
      type: 'courier_destination_either';
      courier: EntityId;
      destinations: [EntityId, EntityId];
    });

export type SolutionManifest = Record<
  EntityId,
  {
    parcel: EntityId;
    destination: EntityId;
  }
>;

export type ProofRule =
  | 'direct_yes'
  | 'direct_no'
  | 'one_to_one_elimination'
  | 'parcel_destination_link'
  | 'parcel_destination_no'
  | 'either_or'
  | 'remaining_candidate'
  | 'contradiction';

export type ProofMark = {
  kind: 'yes' | 'no';
  category: 'parcel' | 'destination';
  courier: EntityId;
  item: EntityId;
};

export type ProofStep = {
  id: string;
  text: string;
  clueIds: string[];
  rule: ProofRule;
  marks?: ProofMark[];
};

export type Puzzle = {
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

export type PlayerMarks = {
  parcels: Record<EntityId, Record<EntityId, CandidateMark>>;
  destinations: Record<EntityId, Record<EntityId, CandidateMark>>;
};

export type ValidationIssue = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
};
