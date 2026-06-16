// @ts-expect-error Runtime fixtures are plain ESM so the Node verifier can import the same source.
import { playablePuzzles } from './puzzleFixtures.js';
// @ts-expect-error Runtime validator is plain ESM so the Node verifier can import the same source.
import { checkSolution } from './puzzleValidator.js';

type Mark = 'unknown' | 'no' | 'yes';
type Category = 'parcels' | 'destinations';

type Entity = {
  id: string;
  label: string;
};

type Clue = {
  id: string;
  type: string;
  text: string;
  courier?: string;
  parcel?: string;
  destination?: string;
  parcels?: [string, string];
  destinations?: [string, string];
};

type Puzzle = {
  id: string;
  title: string;
  difficulty: string;
  learningGoal: string[];
  rulesBeforePlay: string[];
  entities: {
    couriers: Entity[];
    parcels: Entity[];
    destinations: Entity[];
  };
  clues: Clue[];
  solution: Record<string, { parcel: string; destination: string }>;
  proofTrace: Array<{ id: string; text: string; clueIds: string[]; rule: string }>;
};

type Marks = {
  parcels: Record<string, Record<string, Mark>>;
  destinations: Record<string, Record<string, Mark>>;
};

type TinyDispatchOptions = {
  container: HTMLElement;
  buildId: string;
  onExit: () => void;
};

const koreanLabels: Record<string, string> = {
  mina: '미나',
  juno: '주노',
  sol: '솔',
  rafi: '라피',
  lantern: '랜턴',
  books: '책',
  cake: '케이크',
  seeds: '씨앗',
  library: '도서관',
  bakery: '빵집',
  harbor: '항구',
  garden: '정원'
};

const puzzleTitles: Record<string, string> = {
  'first-board': '첫 배달',
  'linked-parcel': '목적지가 정해진 소포',
  'either-or': '둘 중 하나',
  'negative-link': '갈 수 없는 목적지',
  'mixed-daily': '오늘의 배차'
};

const difficultyLabels: Record<string, string> = {
  tutorial: '튜토리얼',
  easy: '쉬움',
  medium: '보통',
  hard: '어려움'
};

const ruleCopy: Record<string, string> = {
  direct_yes: '확정 단서',
  direct_no: '제외 단서',
  one_to_one_elimination: '하나씩만 배정',
  parcel_destination_link: '소포-목적지 연결',
  parcel_destination_no: '소포-목적지 제외',
  either_or: '둘 중 하나',
  remaining_candidate: '남은 후보',
  contradiction: '모순'
};

export class TinyDispatchPrototype {
  private readonly options: TinyDispatchOptions;
  private puzzleIndex = 0;
  private marks: Marks = { parcels: {}, destinations: {} };
  private status = '단서를 읽고 후보를 지워 보세요.';
  private statusTone: 'neutral' | 'good' | 'bad' = 'neutral';
  private hintIndex = 0;
  private selectedClueId = '';
  private completed = new Set<string>();

  constructor(options: TinyDispatchOptions) {
    this.options = options;
  }

  mount(): void {
    this.options.container.classList.add('tiny-dispatch');
    this.setPuzzle(0);
  }

  destroy(): void {
    this.options.container.classList.remove('tiny-dispatch');
    this.options.container.replaceChildren();
  }

  private get puzzle(): Puzzle {
    return playablePuzzles[this.puzzleIndex] as Puzzle;
  }

  private setPuzzle(index: number): void {
    this.puzzleIndex = (index + playablePuzzles.length) % playablePuzzles.length;
    this.marks = this.createEmptyMarks(this.puzzle);
    this.status = '단서를 읽고 후보를 지워 보세요.';
    this.statusTone = 'neutral';
    this.hintIndex = 0;
    this.selectedClueId = '';
    this.render();
  }

  private createEmptyMarks(puzzle: Puzzle): Marks {
    return {
      parcels: Object.fromEntries(
        puzzle.entities.couriers.map((courier) => [
          courier.id,
          Object.fromEntries(puzzle.entities.parcels.map((parcel) => [parcel.id, 'unknown' as Mark]))
        ])
      ),
      destinations: Object.fromEntries(
        puzzle.entities.couriers.map((courier) => [
          courier.id,
          Object.fromEntries(puzzle.entities.destinations.map((destination) => [destination.id, 'unknown' as Mark]))
        ])
      )
    };
  }

  private render(): void {
    const puzzle = this.puzzle;
    const completeRows = this.completeRowCount();
    this.options.container.innerHTML = `
      <main class="td-page">
        <header class="td-header">
          <div class="td-title-block">
            <div class="td-kicker">타이니 디스패치 · ${difficultyLabels[puzzle.difficulty] ?? puzzle.difficulty}</div>
            <h1>${this.escape(puzzleTitles[puzzle.id] ?? puzzle.title)}</h1>
            <div class="td-progress">${this.puzzleIndex + 1}/${playablePuzzles.length} 퍼즐 · ${completeRows}/${puzzle.entities.couriers.length} 배정 완료 · build ${this.escape(this.options.buildId)}</div>
          </div>
          <nav class="td-actions" aria-label="퍼즐 조작">
            <button type="button" data-action="exit">목록</button>
            <button type="button" data-action="prev">이전</button>
            <button type="button" data-action="next">다음</button>
            <button type="button" data-action="reset">리셋</button>
          </nav>
        </header>

        <section class="td-rules" aria-label="규칙">
          <strong>이번 퍼즐에서 배울 것</strong>
          <p>${this.escape(this.learningGoalText(puzzle))}</p>
          <ul>
            ${this.baseRules(puzzle)
              .map((rule) => `<li>${this.escape(rule)}</li>`)
              .join('')}
          </ul>
        </section>

        <section class="td-workspace">
          <section class="td-board-wrap" aria-label="배정 보드">
            ${this.renderBoard('parcels', puzzle.entities.parcels, '소포')}
            ${this.renderBoard('destinations', puzzle.entities.destinations, '목적지')}
          </section>

          <aside class="td-side">
            <section class="td-clues" aria-label="단서">
              <div class="td-section-title">단서</div>
              ${puzzle.clues
                .map(
                  (clue, index) => `
                    <button type="button" class="td-clue ${this.selectedClueId === clue.id ? 'selected' : ''}" data-clue="${this.escape(clue.id)}">
                      <span>${index + 1}</span>
                      <p>${this.escape(this.clueText(clue))}</p>
                    </button>
                  `
                )
                .join('')}
            </section>

            <section class="td-panel">
              <div class="td-section-title">힌트</div>
              <p>${this.escape(this.currentHintText())}</p>
              <button type="button" data-action="hint">힌트 보기</button>
            </section>

            <section class="td-panel td-status ${this.statusTone}">
              <div class="td-section-title">상태</div>
              <p>${this.escape(this.status)}</p>
              <button type="button" data-action="check">확인</button>
            </section>
          </aside>
        </section>
      </main>
    `;
    this.bindEvents();
    this.publishDebugState();
  }

  private renderBoard(category: Category, entities: Entity[], title: string): string {
    const couriers = this.puzzle.entities.couriers;
    return `
      <div class="td-board" data-board="${category}">
        <div class="td-board-title">${title}</div>
        <div class="td-grid" style="--td-cols: ${entities.length + 1}">
          <div class="td-cell td-head"></div>
          ${entities.map((entity) => `<div class="td-cell td-head">${this.escape(this.label(entity.id))}</div>`).join('')}
          ${couriers
            .map(
              (courier) => `
                <div class="td-cell td-rowhead">${this.escape(this.label(courier.id))}</div>
                ${entities
                  .map((entity) => {
                    const mark = this.marks[category][courier.id][entity.id];
                    return `
                      <button
                        type="button"
                        class="td-cell td-mark ${mark}"
                        data-category="${category}"
                        data-courier="${this.escape(courier.id)}"
                        data-item="${this.escape(entity.id)}"
                        aria-label="${this.escape(`${this.label(courier.id)} ${this.label(entity.id)} ${this.markLabel(mark)}`)}"
                      >${this.markGlyph(mark)}</button>
                    `;
                  })
                  .join('')}
              `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    this.options.container.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', () => this.handleAction(button.dataset.action ?? ''));
    });
    this.options.container.querySelectorAll<HTMLButtonElement>('.td-mark').forEach((button) => {
      button.addEventListener('click', () => {
        const category = button.dataset.category as Category;
        const courier = button.dataset.courier ?? '';
        const item = button.dataset.item ?? '';
        this.cycleMark(category, courier, item);
      });
    });
    this.options.container.querySelectorAll<HTMLButtonElement>('.td-clue').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedClueId = button.dataset.clue ?? '';
        this.render();
      });
    });
  }

  private handleAction(action: string): void {
    if (action === 'exit') this.options.onExit();
    if (action === 'prev') this.setPuzzle(this.puzzleIndex - 1);
    if (action === 'next') this.setPuzzle(this.puzzleIndex + 1);
    if (action === 'reset') this.setPuzzle(this.puzzleIndex);
    if (action === 'hint') this.showNextHint();
    if (action === 'check') this.checkCurrent();
  }

  private cycleMark(category: Category, courier: string, item: string): void {
    const current = this.marks[category][courier][item];
    const next: Mark = current === 'unknown' ? 'no' : current === 'no' ? 'yes' : 'unknown';
    this.marks[category][courier][item] = next;
    if (next === 'yes') this.applyPeerElimination(category, courier, item);
    if (next === 'unknown') this.recomputePeerEliminations();
    this.status = next === 'yes' ? '확정 표시를 했습니다. 같은 줄과 같은 항목의 나머지 후보는 제외됩니다.' : '표시를 바꿨습니다.';
    this.statusTone = 'neutral';
    this.render();
  }

  private applyPeerElimination(category: Category, courier: string, item: string): void {
    Object.keys(this.marks[category][courier]).forEach((candidate) => {
      if (candidate !== item) this.marks[category][courier][candidate] = 'no';
    });
    Object.keys(this.marks[category]).forEach((otherCourier) => {
      if (otherCourier !== courier) this.marks[category][otherCourier][item] = 'no';
    });
  }

  private recomputePeerEliminations(): void {
    const explicitYes: Array<{ category: Category; courier: string; item: string }> = [];
    (['parcels', 'destinations'] as Category[]).forEach((category) => {
      Object.entries(this.marks[category]).forEach(([courier, row]) => {
        Object.entries(row).forEach(([item, mark]) => {
          if (mark === 'yes') explicitYes.push({ category, courier, item });
        });
      });
    });
    explicitYes.forEach(({ category, courier, item }) => this.applyPeerElimination(category, courier, item));
  }

  private checkCurrent(): void {
    const manifest = this.currentManifest();
    if (!manifest) {
      this.status = '각 배달원마다 소포 1개와 목적지 1개를 확정해야 합니다.';
      this.statusTone = 'bad';
      this.render();
      return;
    }
    if (checkSolution(this.puzzle, manifest)) {
      this.completed.add(this.puzzle.id);
      this.status = `정답입니다. ${this.manifestText(manifest)}`;
      this.statusTone = 'good';
    } else {
      this.status = '아직 맞지 않습니다. 단서와 모순되는 확정 표시가 있습니다.';
      this.statusTone = 'bad';
    }
    this.render();
  }

  private currentManifest(): Record<string, { parcel: string; destination: string }> | undefined {
    const manifest: Record<string, { parcel: string; destination: string }> = {};
    for (const courier of this.puzzle.entities.couriers) {
      const parcel = this.singleYes(this.marks.parcels[courier.id]);
      const destination = this.singleYes(this.marks.destinations[courier.id]);
      if (!parcel || !destination) return undefined;
      manifest[courier.id] = { parcel, destination };
    }
    return manifest;
  }

  private showNextHint(): void {
    const trace = this.puzzle.proofTrace;
    const fallbackClue = this.puzzle.clues[this.hintIndex % this.puzzle.clues.length];
    if (trace.length > 0) {
      const step = trace[this.hintIndex % trace.length];
      this.selectedClueId = step.clueIds[0] ?? '';
      this.status = `${ruleCopy[step.rule] ?? '힌트'}: ${this.translateProof(step.text)}`;
    } else if (fallbackClue) {
      this.selectedClueId = fallbackClue.id;
      this.status = `먼저 이 단서를 보세요: ${this.clueText(fallbackClue)}`;
    }
    this.statusTone = 'neutral';
    this.hintIndex += 1;
    this.render();
  }

  private currentHintText(): string {
    const trace = this.puzzle.proofTrace;
    if (trace.length > 0) return '힌트를 누르면 검증된 풀이 순서가 한 단계씩 표시됩니다.';
    return '힌트를 누르면 다음에 볼 단서를 하나씩 짚어 줍니다.';
  }

  private singleYes(row: Record<string, Mark>): string | undefined {
    const yes = Object.entries(row)
      .filter(([, mark]) => mark === 'yes')
      .map(([item]) => item);
    return yes.length === 1 ? yes[0] : undefined;
  }

  private completeRowCount(): number {
    return this.puzzle.entities.couriers.filter(
      (courier) => this.singleYes(this.marks.parcels[courier.id]) && this.singleYes(this.marks.destinations[courier.id])
    ).length;
  }

  private manifestText(manifest: Record<string, { parcel: string; destination: string }>): string {
    return Object.entries(manifest)
      .map(([courier, assignment]) => `${this.label(courier)}-${this.label(assignment.parcel)}-${this.label(assignment.destination)}`)
      .join(', ');
  }

  private clueText(clue: Clue): string {
    if (clue.type === 'courier_parcel_yes') return `${this.label(clue.courier)}는 ${this.label(clue.parcel)}을/를 맡습니다.`;
    if (clue.type === 'courier_parcel_no') return `${this.label(clue.courier)}는 ${this.label(clue.parcel)}을/를 맡지 않습니다.`;
    if (clue.type === 'courier_destination_yes') return `${this.label(clue.courier)}는 ${this.label(clue.destination)}에 갑니다.`;
    if (clue.type === 'courier_destination_no') return `${this.label(clue.courier)}는 ${this.label(clue.destination)}에 가지 않습니다.`;
    if (clue.type === 'parcel_destination_link') return `${this.label(clue.parcel)}은/는 ${this.label(clue.destination)}로 갑니다.`;
    if (clue.type === 'parcel_destination_no') return `${this.label(clue.parcel)}은/는 ${this.label(clue.destination)}로 가지 않습니다.`;
    if (clue.type === 'courier_parcel_either') {
      return `${this.label(clue.courier)}는 ${this.label(clue.parcels?.[0])} 또는 ${this.label(clue.parcels?.[1])}을/를 맡습니다.`;
    }
    if (clue.type === 'courier_destination_either') {
      return `${this.label(clue.courier)}는 ${this.label(clue.destinations?.[0])} 또는 ${this.label(clue.destinations?.[1])}에 갑니다.`;
    }
    return clue.text;
  }

  private baseRules(puzzle: Puzzle): string[] {
    if (puzzle.id === 'first-board') {
      return ['각 배달원은 소포 1개와 목적지 1곳만 맡습니다.', '같은 소포와 목적지는 한 번씩만 사용합니다.', '표시는 빈칸 -> X -> 체크 순서로 바뀝니다.'];
    }
    return ['이전 규칙은 그대로 적용됩니다.', '확정 체크를 하면 같은 줄과 같은 항목의 나머지 후보가 X로 바뀝니다.', '완성했다고 생각하면 확인을 누르세요.'];
  }

  private learningGoalText(puzzle: Puzzle): string {
    const fallback = puzzle.learningGoal.join(' ');
    if (puzzle.id === 'first-board') return '기본 배정 규칙과 확정/제외 표시를 익힙니다.';
    if (puzzle.id === 'linked-parcel') return '소포와 목적지가 연결된 단서를 배웁니다.';
    if (puzzle.id === 'either-or') return '둘 중 하나 단서가 후보를 좁히는 방식을 배웁니다.';
    if (puzzle.id === 'negative-link') return '특정 소포가 갈 수 없는 목적지를 제외합니다.';
    if (puzzle.id === 'mixed-daily') return '여러 단서 타입을 섞은 샘플 퍼즐입니다.';
    return fallback;
  }

  private translateProof(text: string): string {
    return text
      .replaceAll('Mina', '미나')
      .replaceAll('Juno', '주노')
      .replaceAll('Sol', '솔')
      .replaceAll('Rafi', '라피')
      .replaceAll('Lantern', '랜턴')
      .replaceAll('Books', '책')
      .replaceAll('Cake', '케이크')
      .replaceAll('Seeds', '씨앗')
      .replaceAll('Library', '도서관')
      .replaceAll('Bakery', '빵집')
      .replaceAll('Harbor', '항구')
      .replaceAll('Garden', '정원');
  }

  private label(id: string | undefined): string {
    if (!id) return '';
    return koreanLabels[id] ?? id;
  }

  private markGlyph(mark: Mark): string {
    if (mark === 'yes') return '✓';
    if (mark === 'no') return '×';
    return '';
  }

  private markLabel(mark: Mark): string {
    if (mark === 'yes') return '확정';
    if (mark === 'no') return '제외';
    return '미정';
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return map[char];
    });
  }

  private publishDebugState(): void {
    window.__tinyDispatchState = {
      puzzleId: this.puzzle.id,
      puzzleIndex: this.puzzleIndex,
      completeRows: this.completeRowCount(),
      status: this.status,
      completed: [...this.completed],
      marks: this.marks
    };
  }
}

declare global {
  interface Window {
    __tinyDispatchState?: {
      puzzleId: string;
      puzzleIndex: number;
      completeRows: number;
      status: string;
      completed: string[];
      marks: Marks;
    };
  }
}
