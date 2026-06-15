import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Text,
  TextStyle
} from 'pixi.js';

type Token = 'B' | 'W' | 'L' | 'X' | '.';

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

type CircuitSketchOptions = {
  container: HTMLElement;
  onStatus: (message: string, tone: 'neutral' | 'good' | 'bad') => void;
  onBoardChange: (board: Board, powered: number) => void;
};

const boards: Board[] = [
  {
    id: 'linear',
    title: 'Board 1',
    goal: 'Power the lamp.',
    grid: [['B', 'W', 'L']],
    requiredLamps: 1
  },
  {
    id: 'detour',
    title: 'Board 2',
    goal: 'Route around the broken wires.',
    grid: [
      ['B', 'W', 'W'],
      ['X', 'X', 'W'],
      ['L', 'W', 'W']
    ],
    requiredLamps: 1
  },
  {
    id: 'two-lamps',
    title: 'Board 3',
    goal: 'Power both lamps.',
    grid: [
      ['B', 'W', 'L'],
      ['X', 'X', 'X'],
      ['B', 'W', 'L']
    ],
    requiredLamps: 2
  }
];

const palette = {
  background: 0xf0f4f7,
  board: 0xffffff,
  boardLine: 0xd1dae6,
  battery: 0xf2c94c,
  batteryStroke: 0x916b00,
  wire: 0xcfd7e3,
  wireStroke: 0x7b8797,
  lamp: 0xf7f0bf,
  lampOn: 0xffd861,
  lampStroke: 0x9d7d16,
  broken: 0x2f3540,
  path: 0x2c7be5,
  pathGood: 0x30a46c,
  pathBad: 0xdb4b4b,
  text: 0x1f2937
};

const labelStyle = new TextStyle({
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 18,
  fontWeight: '700',
  fill: palette.text
});

export class CircuitSketchPrototype {
  private readonly app = new Application();
  private readonly root = new Container();
  private readonly cells = new Map<string, { cell: Cell; graphic: Container }>();
  private readonly pathLayer = new Graphics();
  private readonly options: CircuitSketchOptions;
  private boardIndex = 0;
  private path: Cell[] = [];
  private poweredLampKeys = new Set<string>();
  private dragging = false;
  private resizeObserver?: ResizeObserver;

  constructor(options: CircuitSketchOptions) {
    this.options = options;
  }

  async mount(): Promise<void> {
    await this.app.init({
      background: palette.background,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      resizeTo: this.options.container
    });

    this.options.container.replaceChildren(this.app.canvas);
    this.app.stage.addChild(this.root);
    this.root.addChild(this.pathLayer);
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', () => this.finishPath());
    this.app.stage.on('pointerupoutside', () => this.finishPath());

    this.resizeObserver = new ResizeObserver(() => this.renderBoard());
    this.resizeObserver.observe(this.options.container);
    this.setBoard(0);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.app.destroy(true, { children: true });
  }

  getBoards(): Board[] {
    return boards;
  }

  setBoard(index: number): void {
    this.boardIndex = index;
    this.path = [];
    this.poweredLampKeys = new Set();
    this.options.onStatus('Drag from a battery through wires and end at a lamp.', 'neutral');
    this.options.onBoardChange(this.currentBoard, 0);
    this.renderBoard();
  }

  private get currentBoard(): Board {
    return boards[this.boardIndex];
  }

  private renderBoard(): void {
    const board = this.currentBoard;
    this.root.removeChildren();
    this.cells.clear();

    const rows = board.grid.length;
    const cols = Math.max(...board.grid.map((row) => row.length));
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const cellSize = Math.min(128, Math.floor(Math.min(width / (cols + 1.5), height / (rows + 1.6))));
    const gap = Math.max(8, cellSize * 0.12);
    const boardWidth = cols * cellSize + (cols - 1) * gap;
    const boardHeight = rows * cellSize + (rows - 1) * gap;
    const originX = (width - boardWidth) / 2;
    const originY = (height - boardHeight) / 2;

    const boardPlate = new Graphics();
    boardPlate
      .roundRect(originX - 18, originY - 18, boardWidth + 36, boardHeight + 36, 18)
      .fill(palette.board)
      .stroke({ width: 1, color: palette.boardLine });
    this.root.addChild(boardPlate);
    this.root.addChild(this.pathLayer);

    board.grid.forEach((row, rowIndex) => {
      row.forEach((token, colIndex) => {
        const cell: Cell = { row: rowIndex, col: colIndex, token };
        const x = originX + colIndex * (cellSize + gap);
        const y = originY + rowIndex * (cellSize + gap);
        const graphic = this.createCellGraphic(cell, x, y, cellSize);
        this.cells.set(this.key(cell), { cell, graphic });
        this.root.addChild(graphic);
      });
    });

    this.drawPath(palette.path);
  }

  private createCellGraphic(cell: Cell, x: number, y: number, size: number): Container {
    const container = new Container();
    container.x = x;
    container.y = y;
    container.eventMode = cell.token === 'X' || cell.token === '.' ? 'static' : 'dynamic';
    container.cursor = cell.token === 'X' || cell.token === '.' ? 'not-allowed' : 'pointer';

    const shape = new Graphics();
    const powered = this.poweredLampKeys.has(this.key(cell));

    if (cell.token === 'X') {
      shape.roundRect(0, 0, size, size, 14).fill(palette.broken);
      shape.moveTo(size * 0.25, size * 0.28).lineTo(size * 0.75, size * 0.72).stroke({ width: 5, color: 0xffffff });
      shape.moveTo(size * 0.75, size * 0.28).lineTo(size * 0.25, size * 0.72).stroke({ width: 5, color: 0xffffff });
    } else {
      shape.roundRect(0, 0, size, size, 14).fill(0xffffff).stroke({ width: 1, color: palette.boardLine });
      this.drawToken(shape, cell.token, size, powered);
    }

    const label = new Text({ text: this.labelFor(cell.token), style: labelStyle });
    label.anchor.set(0.5);
    label.x = size / 2;
    label.y = size / 2;

    container.addChild(shape);
    if (cell.token !== '.') {
      container.addChild(label);
    }

    container.on('pointerdown', (event) => this.startPath(cell, event));
    container.on('pointerover', () => this.extendPath(cell));
    container.on('pointertap', (event) => {
      if (!this.dragging) {
        this.startPath(cell, event);
        this.finishPath();
      }
    });

    return container;
  }

  private drawToken(shape: Graphics, token: Token, size: number, powered: boolean): void {
    const cx = size / 2;
    const cy = size / 2;

    if (token === 'B') {
      shape.roundRect(size * 0.24, size * 0.33, size * 0.48, size * 0.34, 8).fill(palette.battery).stroke({
        width: 3,
        color: palette.batteryStroke
      });
      shape.roundRect(size * 0.72, size * 0.43, size * 0.08, size * 0.14, 3).fill(palette.batteryStroke);
    }

    if (token === 'W') {
      shape.moveTo(size * 0.16, cy).lineTo(size * 0.84, cy).stroke({ width: 10, color: palette.wireStroke });
      shape.moveTo(size * 0.16, cy).lineTo(size * 0.84, cy).stroke({ width: 5, color: palette.wire });
    }

    if (token === 'L') {
      shape.circle(cx, cy, size * 0.24).fill(powered ? palette.lampOn : palette.lamp).stroke({
        width: 3,
        color: palette.lampStroke
      });
      shape.moveTo(cx - size * 0.14, cy + size * 0.28).lineTo(cx + size * 0.14, cy + size * 0.28).stroke({
        width: 4,
        color: palette.lampStroke
      });
      if (powered) {
        shape.circle(cx, cy, size * 0.36).stroke({ width: 4, color: 0xffef9a, alpha: 0.9 });
      }
    }
  }

  private labelFor(token: Token): string {
    if (token === 'B') return 'B';
    if (token === 'W') return 'W';
    if (token === 'L') return 'L';
    return '';
  }

  private startPath(cell: Cell, event: FederatedPointerEvent): void {
    event.stopPropagation();
    this.dragging = true;
    this.path = [cell];
    this.drawPath(palette.path);
  }

  private extendPath(cell: Cell): void {
    if (!this.dragging || this.path.length === 0) return;
    const last = this.path[this.path.length - 1];
    const existingIndex = this.path.findIndex((pathCell) => this.key(pathCell) === this.key(cell));

    if (existingIndex === this.path.length - 2) {
      this.path.pop();
      this.drawPath(palette.path);
      return;
    }

    if (existingIndex >= 0 || !this.isAdjacent(last, cell)) return;
    this.path.push(cell);
    this.drawPath(palette.path);
  }

  private finishPath(): void {
    if (!this.dragging) return;
    this.dragging = false;
    const result = this.validatePath();

    if (result.ok) {
      const lamp = this.path[this.path.length - 1];
      this.poweredLampKeys.add(this.key(lamp));
      this.drawPath(palette.pathGood);
      const powered = this.poweredLampKeys.size;
      const complete = powered >= this.currentBoard.requiredLamps;
      this.options.onBoardChange(this.currentBoard, powered);
      this.options.onStatus(
        complete ? 'All lamps powered. Ask the tester what felt clear or confusing.' : 'Lamp powered. Find the next battery path.',
        'good'
      );
      this.renderBoard();
    } else {
      this.drawPath(palette.pathBad);
      this.options.onStatus(result.reason, 'bad');
    }
  }

  private validatePath(): { ok: true } | { ok: false; reason: string } {
    if (this.path.length === 0) return { ok: false, reason: 'Start from a battery.' };
    const first = this.path[0];
    const last = this.path[this.path.length - 1];

    if (first.token !== 'B') return { ok: false, reason: 'Start from a battery.' };
    if (last.token !== 'L') return { ok: false, reason: 'End at a lamp.' };
    if (this.poweredLampKeys.has(this.key(last))) return { ok: false, reason: 'This lamp is already powered.' };

    for (let index = 1; index < this.path.length - 1; index += 1) {
      const token = this.path[index].token;
      if (token === 'X') return { ok: false, reason: 'Broken wires cannot conduct.' };
      if (token !== 'W') return { ok: false, reason: 'Use wires between the battery and lamp.' };
    }

    for (let index = 1; index < this.path.length; index += 1) {
      if (!this.isAdjacent(this.path[index - 1], this.path[index])) {
        return { ok: false, reason: 'This path is not connected.' };
      }
    }

    return { ok: true };
  }

  private drawPath(color: number): void {
    this.pathLayer.clear();
    if (this.path.length < 2) return;
    const points = this.path
      .map((cell) => this.cells.get(this.key(cell))?.graphic)
      .filter((graphic): graphic is Container => Boolean(graphic))
      .map((graphic) => ({
        x: graphic.x + graphic.width / 2,
        y: graphic.y + graphic.height / 2
      }));

    if (points.length < 2) return;
    this.pathLayer.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => this.pathLayer.lineTo(point.x, point.y));
    this.pathLayer.stroke({ width: 9, color, alpha: 0.86, cap: 'round', join: 'round' });
  }

  private isAdjacent(a: Cell, b: Cell): boolean {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }

  private key(cell: Pick<Cell, 'row' | 'col'>): string {
    return `${cell.row}:${cell.col}`;
  }
}
