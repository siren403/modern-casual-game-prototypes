import './styles.css';
import { CircuitSketchPrototype } from './prototypes/circuitSketch';
import { getPrototype, prototypes } from './prototypes/registry';
import { TinyDispatchPrototype } from './prototypes/tinyDispatch/tinyDispatch';

let cleanup: (() => void) | undefined;

function renderShell(content: string, variant: 'home' | 'game' = 'home'): HTMLElement {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Missing #app root');

  cleanup?.();
  cleanup = undefined;

  document.documentElement.classList.toggle('is-game-route', variant === 'game');
  document.body.classList.toggle('is-game-route', variant === 'game');
  app.className = variant === 'game' ? 'app-game' : '';
  app.innerHTML = `
    <div class="shell">
      ${
        variant === 'home'
          ? `<header class="topbar">
              <div class="brand">
                <div class="brand-title">캐주얼 게임 프로토타입</div>
                <div class="brand-subtitle">레퍼런스 분석에서 뽑은 짧은 플레이 테스트</div>
              </div>
              <nav class="topbar-actions">
                <a class="link-button" href="./">목록</a>
                <a class="link-button" href="https://github.com/siren403/modern-casual-game-prototypes" target="_blank" rel="noreferrer">GitHub</a>
              </nav>
            </header>`
          : ''
      }
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

  const buildId =
    (import.meta as ImportMeta & { env?: { VITE_BUILD_ID?: string } }).env?.VITE_BUILD_ID?.slice(0, 7) ?? 'local';

  const root = renderShell(
    `
    <main class="game-shell" aria-label="${prototype.title}">
      <div id="stage" class="game-stage"></div>
    </main>
  `,
    'game'
  );

  const stage = root.querySelector<HTMLElement>('#stage');

  if (!stage) throw new Error('Missing circuit sketch mount node');

  const sketch = new CircuitSketchPrototype({
    container: stage,
    buildId,
    onExit: () => {
      window.location.hash = '';
    }
  });

  sketch.mount().catch((error: unknown) => {
    stage.textContent = error instanceof Error ? error.message : '프로토타입을 불러오지 못했습니다.';
  });

  cleanup = () => sketch.destroy();
}

function renderTinyDispatch(): void {
  const prototype = getPrototype('tiny-dispatch');
  if (!prototype) {
    renderHome();
    return;
  }

  const buildId =
    (import.meta as ImportMeta & { env?: { VITE_BUILD_ID?: string } }).env?.VITE_BUILD_ID?.slice(0, 7) ?? 'local';

  const root = renderShell(
    `
    <main class="tiny-shell" aria-label="${prototype.title}">
      <div id="tiny-dispatch-stage"></div>
    </main>
  `
  );

  const stage = root.querySelector<HTMLElement>('#tiny-dispatch-stage');
  if (!stage) throw new Error('Missing tiny dispatch mount node');

  const dispatch = new TinyDispatchPrototype({
    container: stage,
    buildId,
    onExit: () => {
      window.location.hash = '';
    }
  });

  dispatch.mount();
  cleanup = () => dispatch.destroy();
}

function route(): void {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === 'circuit-sketch') {
    renderCircuitSketch();
    return;
  }
  if (hash === 'tiny-dispatch') {
    renderTinyDispatch();
    return;
  }
  renderHome();
}

window.addEventListener('hashchange', route);
route();
