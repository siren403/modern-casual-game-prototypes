const { createRequire } = require('module');

const knownPlaywrightPaths = [
  process.env.PLAYWRIGHT_MODULE,
  '/home/ubuntu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright',
  '/home/ubuntu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright',
  '/home/ubuntu/.npm/_npx/86170c4cd1c5da32/node_modules/playwright'
].filter(Boolean);

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    const requireFromHere = createRequire(__filename);
    for (const candidate of knownPlaywrightPaths) {
      try {
        return requireFromHere(candidate);
      } catch {
        // Try the next known package location.
      }
    }
  }
  throw new Error('Playwright is not installed. Install playwright or set PLAYWRIGHT_MODULE=/path/to/node_modules/playwright.');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function dispatchTouch(client, type, point) {
  await client.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x: point.x, y: point.y }],
    modifiers: 0
  });
}

async function dragTouch(client, points) {
  await dispatchTouch(client, 'touchStart', points[0]);
  for (const point of points.slice(1)) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await dispatchTouch(client, 'touchMove', point);
  }
  await new Promise((resolve) => setTimeout(resolve, 80));
  await dispatchTouch(client, 'touchEnd', points[points.length - 1]);
}

async function getFirstBoardCenters(page) {
  return page.$eval('canvas', (canvas) => {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const topSpace = Math.max(112, height * 0.18);
    const bottomSpace = 86;
    const cols = 3;
    const rows = 1;
    const usableWidth = Math.max(260, width - 30);
    const usableHeight = Math.max(220, height - topSpace - bottomSpace);
    const cellSize = Math.floor(Math.min(104, usableWidth / (cols + 0.55), usableHeight / (rows + 0.25)));
    const gap = Math.max(8, Math.floor(cellSize * 0.11));
    const boardWidth = cols * cellSize + (cols - 1) * gap;
    const boardHeight = rows * cellSize + (rows - 1) * gap;
    const originX = rect.left + (width - boardWidth) / 2;
    const originY = rect.top + topSpace + (usableHeight - boardHeight) / 2;
    return {
      battery: { x: originX + cellSize / 2, y: originY + cellSize / 2 },
      wire: { x: originX + cellSize + gap + cellSize / 2, y: originY + cellSize / 2 },
      lamp: { x: originX + (cellSize + gap) * 2 + cellSize / 2, y: originY + cellSize / 2 }
    };
  });
}

async function waitForGame(page) {
  await page.waitForSelector('canvas', { timeout: 5000 });
  await page.waitForFunction(() => Boolean(window.__circuitSketchState), null, { timeout: 5000 });
}

async function main() {
  const url = process.env.PIXI_SHELL_URL ?? 'http://127.0.0.1:4175/#/circuit-sketch';
  const { chromium, devices } = loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/home/ubuntu/.cache/ms-playwright/chromium-1226/chrome-linux/chrome'
  });

  try {
    const context = await browser.newContext({
      ...devices['Pixel 7'],
      viewport: { width: 390, height: 844 },
      locale: 'ko-KR'
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    await page.goto(url, { waitUntil: 'networkidle' });
    await waitForGame(page);

    const shell = await page.evaluate(() => ({
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      docW: document.documentElement.scrollWidth,
      docH: document.documentElement.scrollHeight,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      selection: document.getSelection()?.toString() ?? ''
    }));
    assert(shell.scrollX === 0 && shell.scrollY === 0, `game route scrolled: ${JSON.stringify(shell)}`);
    assert(shell.docW <= shell.innerW + 1, `game route has horizontal overflow: ${JSON.stringify(shell)}`);
    assert(shell.docH <= shell.innerH + 1, `game route has vertical overflow: ${JSON.stringify(shell)}`);

    const canvasStyle = await page.$eval('canvas', (canvas) => {
      const style = getComputedStyle(canvas);
      return {
        touchAction: style.touchAction,
        userSelect: style.userSelect,
        webkitUserSelect: style.webkitUserSelect,
        webkitTouchCallout: style.webkitTouchCallout
      };
    });
    assert(canvasStyle.touchAction === 'none', `canvas touch-action is not locked: ${JSON.stringify(canvasStyle)}`);
    assert(
      canvasStyle.userSelect === 'none' || canvasStyle.webkitUserSelect === 'none',
      `canvas user-select is not locked: ${JSON.stringify(canvasStyle)}`
    );

    const browserDefaultsPrevented = await page.$eval('canvas', (canvas) => {
      const contextmenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 });
      const selectstart = new Event('selectstart', { bubbles: true, cancelable: true });
      canvas.dispatchEvent(contextmenu);
      canvas.dispatchEvent(selectstart);
      return { contextmenu: contextmenu.defaultPrevented, selectstart: selectstart.defaultPrevented };
    });
    assert(browserDefaultsPrevented.contextmenu, 'contextmenu was not prevented on canvas');
    assert(browserDefaultsPrevented.selectstart, 'selectstart was not prevented on canvas');

    const centers = await getFirstBoardCenters(page);
    await dispatchTouch(client, 'touchStart', centers.battery);
    await page.waitForTimeout(1500);
    await dispatchTouch(client, 'touchEnd', centers.battery);
    const longPress = await page.evaluate(() => ({
      selection: document.getSelection()?.toString() ?? '',
      state: window.__circuitSketchState
    }));
    assert(longPress.selection === '', `long press created selection: ${JSON.stringify(longPress)}`);

    await page.reload({ waitUntil: 'networkidle' });
    await waitForGame(page);
    const smoothCenters = await getFirstBoardCenters(page);
    await dragTouch(client, [smoothCenters.battery, smoothCenters.wire, smoothCenters.lamp]);
    await page.waitForFunction(() => window.__circuitSketchState?.powered === 1, null, { timeout: 2000 });

    await page.reload({ waitUntil: 'networkidle' });
    await waitForGame(page);
    const fastCenters = await getFirstBoardCenters(page);
    await dragTouch(client, [fastCenters.battery, fastCenters.lamp]);
    await page.waitForFunction(() => window.__circuitSketchState?.powered === 1, null, { timeout: 2000 });

    const finalState = await page.evaluate(() => window.__circuitSketchState);
    console.log(JSON.stringify({ ok: true, url, shell, canvasStyle, finalState }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
