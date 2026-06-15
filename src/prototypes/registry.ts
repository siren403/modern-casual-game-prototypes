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
      '+ 전지에서 시작해 조건을 만족하는 회로를 닫는 퍼즐입니다. 짧지만 틀린 경로와 스위치 조건을 만족하는 경로가 갈리도록 만들어, 단어 맞추기의 후보 판별 재미가 기호 규칙으로 옮겨지는지 확인합니다.',
    route: '#/circuit-sketch'
  }
];

export function getPrototype(id: string): PrototypeMeta | undefined {
  return prototypes.find((prototype) => prototype.id === id);
}
