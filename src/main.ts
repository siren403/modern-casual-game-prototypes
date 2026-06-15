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
          <div class="brand-title">Modern Casual Game Prototypes</div>
          <div class="brand-subtitle">Reference-derived microtests, labeled separately from shipped games</div>
        </div>
        <nav class="topbar-actions">
          <a class="link-button" href="./">Index</a>
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
        <h1>Prototype Index</h1>
        <p>
          This page hosts small playable probes derived from reference-game analysis. Each item is labeled as a prototype or concept test, not as an actual reference game.
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
        <div class="instruction">
          Start at a battery, trace through connected wires, and end at a lamp to power it.
        </div>
        <div id="board-list" class="board-list"></div>
        <div id="status" class="status">Loading prototype...</div>
        <section class="questions">
          <h2>Ask testers</h2>
          <ol>
            <li>Where did you think you should start?</li>
            <li>What told you where to stop?</li>
            <li>What made a path invalid?</li>
            <li>Did this feel like a circuit or just a maze?</li>
            <li>Would later boards feel interesting or all the same?</li>
          </ol>
        </section>
      </aside>
      <section class="stage-wrap">
        <div id="stage" class="stage"></div>
        <div class="legend">
          <span class="legend-item"><span class="legend-swatch battery"></span> Battery</span>
          <span class="legend-item"><span class="legend-swatch wire"></span> Wire</span>
          <span class="legend-item"><span class="legend-swatch lamp"></span> Lamp</span>
          <span class="legend-item"><span class="legend-swatch broken"></span> Broken wire</span>
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
        activeButton.querySelector('span')!.textContent = `${powered}/${board.requiredLamps} lamps`;
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
              <strong>${board.title}</strong>
              <span>0/${board.requiredLamps} lamps</span>
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
