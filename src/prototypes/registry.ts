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
    title: '서킷 스케치',
    type: 'hypothetical concept',
    status: '플레이 가능 마이크로 테스트',
    summary:
      '전지에서 시작해 전선을 따라 전구까지 연결하는 퍼즐입니다. 단어 맞추기 대신 기호 규칙만으로 재미가 생기는지 확인합니다.',
    route: '#/circuit-sketch'
  }
];

export function getPrototype(id: string): PrototypeMeta | undefined {
  return prototypes.find((prototype) => prototype.id === id);
}
