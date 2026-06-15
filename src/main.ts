import './styles.css';
import { CircuitSketchPrototype } from './prototypes/circuitSketch';
import { getPrototype, prototypes } from './prototypes/registry';

let cleanup: (() => void) | undefined;

function renderShell(content: string): HTMLElement {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing #app root');

  cleanup?.();
  cleanup = undefined;

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-title">캐주얼 게임 프로토타입</div>
          <div class="brand-subtitle">레퍼런스 분석에서 뽑은 짧은 플레이 테스트</div>
        </div>
        <nav class="topbar-actions">
          <a class="link-button" href="./">목록</a>
          <a class="link-button" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </header>
      ${content}
    </div>
  `;
  return app;
}

function renderHome(): void {
  renderShell(`
    <main class="home">
      <section class="home-header">
        <h1>플레이 테스트 목록</h1>
        <p>
          작은 규칙 하나가 실제로 이해되고 재미로 이어지는지 확인하는 공간입니다. 각 항목은 출시 게임이 아니라 검증용 프로토타입입니다.
        </p>
      </section>
      <section class="prototype-grid">
        ${prototypes
          .map(
            (prototype) => `
              <a class="prototype-card" href="${prototype.route}">
                <div class="card-meta">
                  <span class="pill">${prototype.type}</span>
                  <span class="pill secondary">${prototype.status}</span>
                </div>
                <h2>${prototype.title}</h2>
                <p>${prototype.summary}</p>
              </a>
            `
          )
          .join('')}
      </section>
    </main>
  `);
}

function renderCircuitSketch(): void {
  const prototype = getPrototype('circuit-sketch');
  if (!prototype) {
    renderHome();
    return;
  }

  const root = renderShell(`
    <main class="prototype-view">
      <aside class="panel">
        <div class="card-meta">
          <span class="pill">${prototype.type}</span>
          <span class="pill secondary">PixiJS microtest</span>
        </div>
        <h1>${prototype.title}</h1>
        <p>${prototype.summary}</p>
        <div class="quick-goal">
          <strong>목표</strong>
          <span>전지, 전선, 전구를 차례대로 눌러 이어 주세요.</span>
        </div>
        <div class="instruction-list" aria-label="조작 방법">
          <div><strong>1</strong><span>노란 전지를 탭해서 시작</span></div>
          <div><strong>2</strong><span>옆 칸의 회색 전선을 순서대로 탭</span></div>
          <div><strong>3</strong><span>전구를 탭하면 성공</span></div>
        </div>
        <div id="board-list" class="board-list"></div>
        <div id="status" class="status">프로토타입을 불러오는 중...</div>
        <details class="questions">
          <summary>테스트할 때 볼 질문</summary>
          <ol>
            <li>어디서 시작해야 한다고 느꼈나?</li>
            <li>어디서 끝내야 한다고 느꼈나?</li>
            <li>실패한 이유를 바로 이해했나?</li>
            <li>미로가 아니라 회로처럼 느껴졌나?</li>
            <li>스테이지가 늘어나도 새로울 것 같나?</li>
          </ol>
        </details>
      </aside>
      <section class="stage-wrap">
        <div id="stage" class="stage"></div>
        <div class="legend">
          <span class="legend-item"><span class="legend-swatch battery"></span> 전지</span>
          <span class="legend-item"><span class="legend-swatch wire"></span> 전선</span>
          <span class="legend-item"><span class="legend-swatch lamp"></span> 전구</span>
          <span class="legend-item"><span class="legend-swatch broken"></span> 끊긴 전선</span>
        </div>
      </section>
    </main>
  `);

  const stage = root.querySelector<HTMLElement>('#stage');
  const status = root.querySelector<HTMLElement>('#status');
  const boardList = root.querySelector<HTMLElement>('#board-list');

  if (!stage || !status || !boardList) throw new Error('Missing circuit sketch mount nodes');

  const setStatus = (message: string, tone: 'neutral' | 'good' | 'bad') => {
    status.textContent = message;
    status.className = `status ${tone === 'neutral' ? '' : tone}`.trim();
  };

  const sketch = new CircuitSketchPrototype({
    container: stage,
    onStatus: setStatus,
    onBoardChange: (board, powered) => {
      const activeButton = boardList.querySelector<HTMLButtonElement>(`[data-board="${board.id}"]`);
      if (activeButton) {
        activeButton.querySelector('.board-progress')!.textContent = `${powered}/${board.requiredLamps} 전구`;
      }
    }
  });

  sketch
    .mount()
    .then(() => {
      boardList.innerHTML = sketch
        .getBoards()
        .map(
          (board, index) => `
            <button class="board-button ${index === 0 ? 'active' : ''}" data-board="${board.id}" data-index="${index}">
              <span class="board-copy">
                <strong>${board.title}</strong>
                <small>${board.goal}</small>
              </span>
              <span class="board-progress">0/${board.requiredLamps} 전구</span>
            </button>
          `
        )
        .join('');

      boardList.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.board-button');
        if (!button) return;
        boardList.querySelectorAll('.board-button').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        sketch.setBoard(Number(button.dataset.index));
      });
    })
    .catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : 'Failed to load prototype.', 'bad');
    });

  cleanup = () => sketch.destroy();
}

function route(): void {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'circuit-sketch') {
    renderCircuitSketch();
    return;
  }
  renderHome();
}

window.addEventListener('hashchange', route);
route();
