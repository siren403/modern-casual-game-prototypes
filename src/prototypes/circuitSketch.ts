import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Text,
  TextStyle
} from 'pixi.js';

type Token = 'B' | 'W' | 'L' | 'X' | '.';
type Tone = 'neutral' | 'good' | 'bad';

type Cell = {
  row: number;
  col: number;
  token: Token;
};

type Board = {
  id: string;
  title: string;
  goal: string;
  grid: Token[][];
  requiredLamps: number;
};

type CellView = {
  cell: Cell;
  x: number;
  y: number;
  size: number;
};

type CircuitSketchOptions = {
  container: HTMLElement;
  buildId: string;
  onExit: () => void;
};

declare global {
  interface Window {
    __circuitSketchState?: {
      boardIndex: number;
      powered: number;
      dragging: boolean;
      pathLength: number;
      toast: string;
      buildId: string;
    };
  }
}

const boards: Board[] = [
  {
    id: 'linear',
    title: '1단계',
    goal: '전구 1개 켜기',
    grid: [['B', 'W', 'L']],
    requiredLamps: 1
  },
  {
    id: 'detour',
    title: '2단계',
    goal: '끊긴 전선을 피해 연결',
    grid: [
      ['B', 'W', 'W'],
      ['X', 'X', 'W'],
      ['L', 'W', 'W']
    ],
    requiredLamps: 1
  },
  {
    id: 'two-lamps',
    title: '3단계',
    goal: '전구 2개 모두 켜기',
    grid: [
      ['B', 'W', 'L'],
      ['X', 'X', 'X'],
      ['B', 'W', 'L']
    ],
    requiredLamps: 2
  }
];

const palette = {
  background: 0xf4f7f9,
  panel: 0xffffff,
  line: 0xd4dde8,
  text: 0x18212f,
  muted: 0x5c6675,
  battery: 0xf2c94c,
  batteryStroke: 0x8f6500,
  wire: 0xcfd7e3,
  wireStroke: 0x7a8798,
  lamp: 0xf7f0bf,
  lampOn: 0xffd65a,
  lampStroke: 0x957415,
  broken: 0x2f3540,
  path: 0x2670d9,
  pathGood: 0x2f9e68,
  pathBad: 0xd64545,
  guide: 0x1f7a5b
};

const fontFamily = 'Inter, system-ui, Apple SD Gothic Neo, Malgun Gothic, sans-serif';

const styles = {
  title: new TextStyle({ fontFamily, fontSize: 25, fontWeight: '800', fill: palette.text }),
  body: new TextStyle({ fontFamily, fontSize: 15, fontWeight: '600', fill: palette.muted }),
  small: new TextStyle({ fontFamily, fontSize: 12, fontWeight: '600', fill: palette.muted }),
  label: new TextStyle({ fontFamily, fontSize: 18, fontWeight: '800', fill: palette.text }),
  toast: new TextStyle({ fontFamily, fontSize: 16, fontWeight: '800', fill: palette.text }),
  button: new TextStyle({ fontFamily, fontSize: 14, fontWeight: '800', fill: palette.text })
};

export class CircuitSketchPrototype {
  private readonly app = new Application();
  private readonly root = new Container();
  private readonly boardLayer = new Container();
  private readonly completedPathLayer = new Graphics();
  private readonly pathLayer = new Graphics();
  private readonly feedbackLayer = new Graphics();
  private readonly guideLayer = new Graphics();
  private readonly hudLayer = new Container();
  private readonly modalLayer = new Container();
  private readonly cells = new Map<string, CellView>();
  private readonly options: CircuitSketchOptions;
  private boardIndex = 0;
  private path: Cell[] = [];
  private completedPaths: Cell[][] = [];
  private poweredLampKeys = new Set<string>();
  private dragging = false;
  private pointerId: number | undefined;
  private previewPoint: { x: number; y: number } | undefined;
  private lastPointerPoint: { x: number; y: number } | undefined;
  private toast = '전지에서 전구까지 드래그하세요.';
  private tone: Tone = 'neutral';
  private unlockedLevelControls = false;
  private guideClock = 0;
  private resizeObserver?: ResizeObserver;
  private resetTimer?: ReturnType<typeof window.setTimeout>;
  private readonly domGuards: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
    options?: AddEventListenerOptions;
  }> = [];

  constructor(options: CircuitSketchOptions) {
    this.options = options;
  }

  async mount(): Promise<void> {
    await this.app.init({
      background: palette.background,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      resizeTo: this.options.container
    });

    this.app.canvas.setAttribute('aria-label', '서킷 스케치 플레이 캔버스');
    this.app.canvas.style.display = 'block';
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    this.app.canvas.style.touchAction = 'none';
    this.app.canvas.style.userSelect = 'none';
    this.app.canvas.draggable = false;
    this.options.container.replaceChildren(this.app.canvas);
    this.installDomGuards();

    this.root.addChild(
      this.boardLayer,
      this.completedPathLayer,
      this.pathLayer,
      this.feedbackLayer,
      this.guideLayer,
      this.hudLayer,
      this.modalLayer
    );
    this.app.stage.addChild(this.root);
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (event) => this.onPointerDown(event));
    this.app.stage.on('pointermove', (event) => this.onPointerMove(event));
    this.app.stage.on('pointerup', (event) => this.onPointerUp(event));
    this.app.stage.on('pointerupoutside', (event) => this.onPointerUp(event));
    this.app.stage.on('pointercancel', (event) => this.onPointerCancel(event));
    this.app.ticker.add(this.animateGuide);

    this.resizeObserver = new ResizeObserver(() => this.renderScene());
    this.resizeObserver.observe(this.options.container);
    this.setBoard(0);
  }

  destroy(): void {
    window.clearTimeout(this.resetTimer);
    this.removeDomGuards();
    this.resizeObserver?.disconnect();
    this.app.ticker.remove(this.animateGuide);
    this.app.destroy(true, { children: true });
  }

  private setBoard(index: number): void {
    this.boardIndex = index;
    this.path = [];
    this.completedPaths = [];
    this.poweredLampKeys = new Set();
    this.dragging = false;
    this.pointerId = undefined;
    this.previewPoint = undefined;
    this.lastPointerPoint = undefined;
    this.lastPointerPoint = undefined;
    this.toast = '전지에서 전구까지 드래그하세요.';
    this.tone = 'neutral';
    this.renderScene();
  }

  private get currentBoard(): Board {
    return boards[this.boardIndex];
  }

  private get isLandscapeBlocked(): boolean {
    const { width, height } = this.app.screen;
    return width > height && width >= 640;
  }

  private renderScene(): void {
    this.boardLayer.removeChildren();
    this.hudLayer.removeChildren();
    this.modalLayer.removeChildren();
    this.cells.clear();
    this.completedPathLayer.clear();
    this.pathLayer.clear();
    this.feedbackLayer.clear();
    this.guideLayer.clear();
    this.app.stage.hitArea = this.app.screen;

    if (this.isLandscapeBlocked) {
      this.renderOrientationPrompt();
      return;
    }

    this.renderBoard();
    this.drawCompletedPaths();
    this.drawActivePath(palette.path);
    this.drawGuide();
    this.renderHud();
    this.publishDebugState();
  }

  private renderBoard(): void {
    const board = this.currentBoard;
    const rows = board.grid.length;
    const cols = Math.max(...board.grid.map((row) => row.length));
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const topSpace = Math.max(112, height * 0.18);
    const bottomSpace = this.unlockedLevelControls ? 116 : 86;
    const usableWidth = Math.max(260, width - 30);
    const usableHeight = Math.max(220, height - topSpace - bottomSpace);
    const cellSize = Math.floor(Math.min(104, usableWidth / (cols + 0.55), usableHeight / (rows + 0.25)));
    const gap = Math.max(8, Math.floor(cellSize * 0.11));
    const boardWidth = cols * cellSize + (cols - 1) * gap;
    const boardHeight = rows * cellSize + (rows - 1) * gap;
    const originX = (width - boardWidth) / 2;
    const originY = topSpace + (usableHeight - boardHeight) / 2;

    const plate = new Graphics();
    plate
      .roundRect(originX - 14, originY - 14, boardWidth + 28, boardHeight + 28, 16)
      .fill(palette.panel)
      .stroke({ width: 1, color: palette.line });
    this.boardLayer.addChild(plate);

    board.grid.forEach((row, rowIndex) => {
      row.forEach((token, colIndex) => {
        const cell: Cell = { row: rowIndex, col: colIndex, token };
        const x = originX + colIndex * (cellSize + gap);
        const y = originY + rowIndex * (cellSize + gap);
        this.cells.set(this.key(cell), { cell, x, y, size: cellSize });
        this.boardLayer.addChild(this.createCellGraphic(cell, x, y, cellSize));
      });
    });
  }

  private createCellGraphic(cell: Cell, x: number, y: number, size: number): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    const shape = new Graphics();
    const powered = this.poweredLampKeys.has(this.key(cell));

    if (cell.token === 'X') {
      shape.roundRect(0, 0, size, size, 12).fill(palette.broken);
      shape.moveTo(size * 0.25, size * 0.28).lineTo(size * 0.75, size * 0.72).stroke({ width: 5, color: 0xffffff });
      shape.moveTo(size * 0.75, size * 0.28).lineTo(size * 0.25, size * 0.72).stroke({ width: 5, color: 0xffffff });
    } else {
      shape.roundRect(0, 0, size, size, 12).fill(0xffffff).stroke({ width: 1, color: palette.line });
      this.drawToken(shape, cell.token, size, powered);
    }

    const label = new Text({ text: this.labelFor(cell.token), style: styles.label });
    label.anchor.set(0.5);
    label.x = size / 2;
    label.y = size / 2;

    container.addChild(shape);
    if (cell.token !== '.') container.addChild(label);
    return container;
  }

  private drawToken(shape: Graphics, token: Token, size: number, powered: boolean): void {
    const cx = size / 2;
    const cy = size / 2;

    if (token === 'B') {
      shape.roundRect(size * 0.23, size * 0.33, size * 0.5, size * 0.34, 8).fill(palette.battery).stroke({
        width: 3,
        color: palette.batteryStroke
      });
      shape.roundRect(size * 0.72, size * 0.43, size * 0.09, size * 0.14, 3).fill(palette.batteryStroke);
    }

    if (token === 'W') {
      shape.moveTo(size * 0.15, cy).lineTo(size * 0.85, cy).stroke({ width: 10, color: palette.wireStroke });
      shape.moveTo(size * 0.15, cy).lineTo(size * 0.85, cy).stroke({ width: 5, color: palette.wire });
    }

    if (token === 'L') {
      shape.circle(cx, cy, size * 0.24).fill(powered ? palette.lampOn : palette.lamp).stroke({
        width: 3,
        color: palette.lampStroke
      });
      shape.moveTo(cx - size * 0.15, cy + size * 0.29).lineTo(cx + size * 0.15, cy + size * 0.29).stroke({
        width: 4,
        color: palette.lampStroke
      });
      if (powered) shape.circle(cx, cy, size * 0.38).stroke({ width: 4, color: 0xffe890, alpha: 0.88 });
    }
  }

  private renderHud(): void {
    this.hudLayer.removeChildren();
    const { width, height } = this.app.screen;
    const board = this.currentBoard;
    const powered = this.poweredLampKeys.size;
    const complete = powered >= board.requiredLamps;

    const title = this.addText('서킷 스케치', styles.title, 20, 16);
    title.anchor.set(0, 0);
    const goal = this.addText(`${board.title} · ${board.goal}`, styles.body, 20, 50);
    goal.anchor.set(0, 0);
    const progress = this.addText(`${powered}/${board.requiredLamps} 전구`, styles.body, width - 20, 50);
    progress.anchor.set(1, 0);

    const toastWidth = Math.min(width - 30, 390);
    const toastBox = new Graphics();
    const toastColor = this.tone === 'good' ? 0xe9f8ef : this.tone === 'bad' ? 0xffeeee : 0xffffff;
    const toastLine = this.tone === 'good' ? palette.pathGood : this.tone === 'bad' ? palette.pathBad : palette.line;
    toastBox
      .roundRect((width - toastWidth) / 2, height - 74, toastWidth, 44, 10)
      .fill(toastColor)
      .stroke({ width: 1, color: toastLine });
    this.hudLayer.addChild(toastBox);

    const toast = this.addText(this.toast, styles.toast, width / 2, height - 52);
    toast.anchor.set(0.5);

    this.hudLayer.addChild(this.createButton('목록', 20, height - 66, 62, 36, () => this.options.onExit()));
    this.hudLayer.addChild(this.createButton('리셋', width - 82, height - 66, 62, 36, () => this.setBoard(this.boardIndex)));

    if (complete) {
      const next = this.boardIndex === boards.length - 1 ? 0 : this.boardIndex + 1;
      this.hudLayer.addChild(this.createButton('다음', width - 82, 16, 62, 36, () => this.setBoard(next)));
    }

    if (this.unlockedLevelControls) {
      const startX = Math.max(92, width / 2 - 91);
      boards.forEach((_, index) => {
        const active = index === this.boardIndex;
        this.hudLayer.addChild(
          this.createButton(`${index + 1}`, startX + index * 62, height - 116, 46, 34, () => this.setBoard(index), active)
        );
      });
    }

    const build = this.addText(`build ${this.options.buildId}`, styles.small, width - 14, height - 18);
    build.anchor.set(1, 0.5);
  }

  private createButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onPress: () => void,
    active = false
  ): Container {
    const button = new Container();
    button.x = x;
    button.y = y;
    button.eventMode = 'dynamic';
    button.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 8)
      .fill(active ? 0xdff3e7 : 0xffffff)
      .stroke({ width: 1, color: active ? palette.pathGood : palette.line });
    const text = new Text({ text: label, style: styles.button });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;

    button.addChild(bg, text);
    button.on('pointerdown', (event: FederatedPointerEvent) => {
      this.preventBrowserGesture(event);
      event.stopPropagation();
      onPress();
    });
    return button;
  }

  private addText(text: string, style: TextStyle, x: number, y: number): Text {
    const label = new Text({ text, style });
    label.x = x;
    label.y = y;
    this.hudLayer.addChild(label);
    return label;
  }

  private renderOrientationPrompt(): void {
    const { width, height } = this.app.screen;
    const bg = new Graphics();
    bg.rect(0, 0, width, height).fill(palette.background);
    const boxWidth = Math.min(width - 48, 420);
    bg.roundRect((width - boxWidth) / 2, height / 2 - 70, boxWidth, 140, 16)
      .fill(0xffffff)
      .stroke({ width: 1, color: palette.line });
    this.modalLayer.addChild(bg);

    const title = new Text({ text: '세로 화면에서 플레이', style: styles.title });
    title.anchor.set(0.5);
    title.x = width / 2;
    title.y = height / 2 - 26;
    const body = new Text({ text: '이 프로토타입은 드래그 경로를 보기 위해 세로 화면만 사용합니다.', style: styles.body });
    body.anchor.set(0.5);
    body.x = width / 2;
    body.y = height / 2 + 18;
    this.modalLayer.addChild(title, body);
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    this.preventBrowserGesture(event);
    if (this.isLandscapeBlocked) return;

    const hit = this.hitTest(event.global.x, event.global.y);
    if (!hit) return;

    if (hit.token !== 'B') {
      this.flashCell(hit, palette.pathBad);
      this.setToast('전지에서 시작하세요.', 'bad');
      return;
    }

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.path = [hit];
    this.previewPoint = { x: event.global.x, y: event.global.y };
    this.lastPointerPoint = this.previewPoint;
    this.capturePointer(event.pointerId);
    this.setToast('손을 떼지 말고 전구까지', 'neutral');
    this.drawActivePath(palette.path);
    this.drawGuide();
    this.publishDebugState();
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    this.preventBrowserGesture(event);
    if (!this.dragging || this.pointerId !== event.pointerId) return;

    const nextPoint = { x: event.global.x, y: event.global.y };
    this.previewPoint = nextPoint;
    this.extendAlongPointerSegment(this.lastPointerPoint ?? nextPoint, nextPoint);
    this.lastPointerPoint = nextPoint;
    this.drawActivePath(palette.path);
    this.publishDebugState();
  }

  private onPointerUp(event: FederatedPointerEvent): void {
    this.preventBrowserGesture(event);
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    this.releasePointer(event.pointerId);
    this.finishDrag();
  }

  private onPointerCancel(event: FederatedPointerEvent): void {
    this.preventBrowserGesture(event);
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    this.releasePointer(event.pointerId);
    this.failDrag('드래그가 끊겼습니다. 다시 전지에서 시작하세요.');
  }

  private extendAlongPointerSegment(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const cellSize = this.path[0] ? this.cells.get(this.key(this.path[0]))?.size : undefined;
    const step = Math.max(10, Math.min(26, (cellSize ?? 70) * 0.28));
    const samples = Math.max(1, Math.ceil(distance / step));
    let lastKey = '';

    for (let index = 1; index <= samples; index += 1) {
      const t = index / samples;
      const point = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t
      };
      const hit = this.hitTest(point.x, point.y);
      if (!hit) continue;
      const key = this.key(hit);
      if (key === lastKey) continue;
      lastKey = key;
      this.tryExtend(hit, index === samples);
    }
  }

  private tryExtend(cell: Cell, allowUndo = true): void {
    if (this.path.length === 0) return;
    const last = this.path[this.path.length - 1];
    const existingIndex = this.path.findIndex((pathCell) => this.key(pathCell) === this.key(cell));

    if (existingIndex === this.path.length - 1) return;
    if (allowUndo && existingIndex === this.path.length - 2 && this.path.length > 1) {
      this.path.pop();
      this.setToast('한 칸 되돌렸습니다.', 'neutral');
      return;
    }
    if (existingIndex >= 0) {
      if (!allowUndo) return;
      this.flashCell(cell, palette.pathBad);
      this.setToast('지나간 칸은 다시 못 갑니다.', 'bad');
      return;
    }
    if (!this.isAdjacent(last, cell)) {
      this.setToast('붙어 있는 칸으로만 이어집니다.', 'bad');
      return;
    }
    if (cell.token === 'X' || cell.token === '.') {
      this.flashCell(cell, palette.pathBad);
      this.setToast('끊긴 전선은 지나갈 수 없습니다.', 'bad');
      return;
    }
    if (cell.token === 'B') {
      this.flashCell(cell, palette.pathBad);
      this.setToast('전선이나 전구로 이어야 합니다.', 'bad');
      return;
    }

    this.path.push(cell);
    this.setToast(cell.token === 'L' ? '전구 위에서 손을 떼세요.' : '계속 전구까지 이어 보세요.', 'neutral');
    this.publishDebugState();
  }

  private finishDrag(): void {
    const result = this.validatePath();
    if (!result.ok) {
      this.failDrag(result.reason);
      return;
    }

    const lamp = this.path[this.path.length - 1];
    this.poweredLampKeys.add(this.key(lamp));
    this.completedPaths.push([...this.path]);
    this.unlockedLevelControls = true;
    this.dragging = false;
    this.pointerId = undefined;
    this.previewPoint = undefined;
    this.lastPointerPoint = undefined;
    const complete = this.poweredLampKeys.size >= this.currentBoard.requiredLamps;
    this.setToast(complete ? '성공. 다른 단계가 열렸습니다.' : '전구가 켜졌습니다. 계속 이어 보세요.', 'good');
    this.renderScene();
  }

  private failDrag(reason: string): void {
    this.setToast(reason, 'bad');
    this.drawActivePath(palette.pathBad, false);
    this.dragging = false;
    this.pointerId = undefined;
    this.previewPoint = undefined;
    window.clearTimeout(this.resetTimer);
    this.resetTimer = window.setTimeout(() => {
      this.path = [];
      this.setToast('전지에서 전구까지 드래그하세요.', 'neutral');
      this.renderScene();
    }, 620);
  }

  private validatePath(): { ok: true } | { ok: false; reason: string } {
    if (this.path.length === 0) return { ok: false, reason: '전지에서 시작해야 합니다.' };
    const first = this.path[0];
    const last = this.path[this.path.length - 1];

    if (first.token !== 'B') return { ok: false, reason: '전지에서 시작해야 합니다.' };
    if (last.token !== 'L') return { ok: false, reason: '전구에서 손을 떼세요.' };
    if (this.poweredLampKeys.has(this.key(last))) return { ok: false, reason: '이미 켜진 전구입니다.' };

    for (let index = 1; index < this.path.length - 1; index += 1) {
      if (this.path[index].token !== 'W') return { ok: false, reason: '중간에는 전선만 지나갑니다.' };
    }

    for (let index = 1; index < this.path.length; index += 1) {
      if (!this.isAdjacent(this.path[index - 1], this.path[index])) {
        return { ok: false, reason: '이어진 칸끼리만 연결할 수 있습니다.' };
      }
    }

    return { ok: true };
  }

  private drawCompletedPaths(): void {
    this.completedPathLayer.clear();
    this.completedPaths.forEach((path) => this.strokePath(this.completedPathLayer, path, palette.pathGood, false));
  }

  private drawActivePath(color: number, includePreview = true): void {
    this.pathLayer.clear();
    this.strokePath(this.pathLayer, this.path, color, includePreview);
  }

  private strokePath(layer: Graphics, cells: Cell[], color: number, includePreview: boolean): void {
    const points = cells
      .map((cell) => this.cellCenter(cell))
      .filter((point): point is { x: number; y: number } => Boolean(point));

    if (includePreview && this.previewPoint && points.length > 0) points.push(this.previewPoint);
    if (points.length === 0) return;

    const start = points[0];
    layer.circle(start.x, start.y, 15).stroke({ width: 4, color, alpha: 0.88 });
    if (points.length < 2) return;

    layer.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => layer.lineTo(point.x, point.y));
    layer.stroke({ width: 10, color, alpha: 0.88, cap: 'round', join: 'round' });
  }

  private drawGuide(): void {
    this.guideLayer.clear();
    if (this.dragging || this.poweredLampKeys.size > 0) return;
    const starts = [...this.cells.values()].filter(({ cell }) => cell.token === 'B');
    const lamps = [...this.cells.values()].filter(({ cell }) => cell.token === 'L');
    const start = starts[0];
    const lamp = lamps[0];
    if (!start || !lamp) return;

    const pulse = 0.5 + Math.sin(this.guideClock) * 0.5;
    const startCenter = this.centerOfView(start);
    const lampCenter = this.centerOfView(lamp);
    this.guideLayer.circle(startCenter.x, startCenter.y, start.size * (0.45 + pulse * 0.08)).stroke({
      width: 4,
      color: palette.guide,
      alpha: 0.75
    });
    this.guideLayer.circle(lampCenter.x, lampCenter.y, lamp.size * 0.38).stroke({
      width: 4,
      color: palette.lampOn,
      alpha: 0.75
    });
    this.guideLayer.moveTo(startCenter.x, startCenter.y).lineTo(lampCenter.x, lampCenter.y).stroke({
      width: 5,
      color: palette.guide,
      alpha: 0.2,
      cap: 'round'
    });
    const t = (Math.sin(this.guideClock * 0.75) + 1) / 2;
    this.guideLayer.circle(startCenter.x + (lampCenter.x - startCenter.x) * t, startCenter.y + (lampCenter.y - startCenter.y) * t, 9)
      .fill(0xffffff)
      .stroke({ width: 3, color: palette.guide, alpha: 0.9 });
  }

  private flashCell(cell: Cell, color: number): void {
    const view = this.cells.get(this.key(cell));
    if (!view) return;
    this.feedbackLayer.clear();
    this.feedbackLayer
      .roundRect(view.x - 5, view.y - 5, view.size + 10, view.size + 10, 15)
      .stroke({ width: 4, color, alpha: 0.85 });
    window.clearTimeout(this.resetTimer);
    this.resetTimer = window.setTimeout(() => this.feedbackLayer.clear(), 260);
  }

  private setToast(message: string, tone: Tone): void {
    this.toast = message;
    this.tone = tone;
    this.renderHud();
    this.publishDebugState();
  }

  private hitTest(x: number, y: number): Cell | undefined {
    for (const view of this.cells.values()) {
      const pad = Math.min(18, view.size * 0.18);
      if (x >= view.x - pad && x <= view.x + view.size + pad && y >= view.y - pad && y <= view.y + view.size + pad) {
        return view.cell;
      }
    }
    return undefined;
  }

  private cellCenter(cell: Cell): { x: number; y: number } | undefined {
    const view = this.cells.get(this.key(cell));
    if (!view) return undefined;
    return this.centerOfView(view);
  }

  private centerOfView(view: CellView): { x: number; y: number } {
    return { x: view.x + view.size / 2, y: view.y + view.size / 2 };
  }

  private animateGuide = (): void => {
    if (this.isLandscapeBlocked) return;
    this.guideClock += 0.05;
    this.drawGuide();
  };

  private labelFor(token: Token): string {
    if (token === 'B') return '전';
    if (token === 'W') return '선';
    if (token === 'L') return '등';
    return '';
  }

  private isAdjacent(a: Cell, b: Cell): boolean {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  private key(cell: Pick<Cell, 'row' | 'col'>): string {
    return `${cell.row}:${cell.col}`;
  }

  private preventBrowserGesture(event: FederatedPointerEvent): void {
    const nativeEvent = event.nativeEvent;
    if (nativeEvent && 'preventDefault' in nativeEvent) nativeEvent.preventDefault();
  }

  private publishDebugState(): void {
    window.__circuitSketchState = {
      boardIndex: this.boardIndex,
      powered: this.poweredLampKeys.size,
      dragging: this.dragging,
      pathLength: this.path.length,
      toast: this.toast,
      buildId: this.options.buildId
    };
  }

  private installDomGuards(): void {
    const guardedTargets = [this.options.container, this.app.canvas];
    const passiveFalse: AddEventListenerOptions = { passive: false };
    const capturePassiveFalse: AddEventListenerOptions = { capture: true, passive: false };

    guardedTargets.forEach((target) => {
      this.addDomGuard(target, 'contextmenu', this.suppressBrowserEvent, capturePassiveFalse);
      this.addDomGuard(target, 'dragstart', this.suppressBrowserEvent, capturePassiveFalse);
      this.addDomGuard(target, 'selectstart', this.suppressBrowserEvent, capturePassiveFalse);
      this.addDomGuard(target, 'touchstart', this.suppressBrowserEvent, passiveFalse);
      this.addDomGuard(target, 'touchmove', this.suppressBrowserEvent, passiveFalse);
      this.addDomGuard(target, 'gesturestart', this.suppressBrowserEvent, passiveFalse);
    });
  }

  private removeDomGuards(): void {
    this.domGuards.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(type, listener, options);
    });
    this.domGuards.length = 0;
  }

  private addDomGuard(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.domGuards.push({ target, type, listener, options });
  }

  private readonly suppressBrowserEvent: EventListener = (event) => {
    event.preventDefault();
  };

  private capturePointer(pointerId: number): void {
    try {
      if (this.app.canvas.setPointerCapture) this.app.canvas.setPointerCapture(pointerId);
    } catch {
      // Some WebKit builds throw if capture is attempted after implicit release.
    }
  }

  private releasePointer(pointerId: number): void {
    try {
      if (this.app.canvas.hasPointerCapture?.(pointerId)) this.app.canvas.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture can already be released by the browser on cancel.
    }
  }
}
