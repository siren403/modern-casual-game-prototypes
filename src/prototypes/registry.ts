export type PrototypeMeta = {
  id: string;
  title: string;
  type: 'hypothetical concept';
  status: string;
  summary: string;
  route: string;
};

export const prototypes: PrototypeMeta[] = [
  {
    id: 'circuit-sketch',
    title: 'Circuit Sketch',
    type: 'hypothetical concept',
    status: 'No-code test promoted to playable microtest',
    summary:
      'Trace from batteries through wires to light lamps. Tests whether a symbol grammar can replace a word-list puzzle loop.',
    route: '#/circuit-sketch'
  }
];

export function getPrototype(id: string): PrototypeMeta | undefined {
  return prototypes.find((prototype) => prototype.id === id);
}
