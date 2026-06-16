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
        // Try next known install.
      }
    }
  }
  throw new Error('Playwright is not installed. Install playwright or set PLAYWRIGHT_MODULE.');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function setYes(page, category, courier, item) {
  const selector = `[data-category="${category}"][data-courier="${courier}"][data-item="${item}"]`;
  for (let index = 0; index < 3; index += 1) {
    const text = await page.locator(selector).innerText();
    if (text.includes('✓')) return;
    await page.locator(selector).click();
  }
  const finalText = await page.locator(selector).innerText();
  assert(finalText.includes('✓'), `cell did not become yes: ${selector} text=${finalText}`);
}

async function solveFirstBoard(page) {
  await setYes(page, 'parcels', 'mina', 'lantern');
  await setYes(page, 'destinations', 'mina', 'garden');
  await setYes(page, 'parcels', 'juno', 'books');
  await setYes(page, 'destinations', 'juno', 'library');
  await setYes(page, 'parcels', 'sol', 'cake');
  await setYes(page, 'destinations', 'sol', 'bakery');
}

async function fillWrongFirstBoard(page) {
  await setYes(page, 'parcels', 'mina', 'lantern');
  await setYes(page, 'destinations', 'mina', 'bakery');
  await setYes(page, 'parcels', 'juno', 'books');
  await setYes(page, 'destinations', 'juno', 'garden');
  await setYes(page, 'parcels', 'sol', 'cake');
  await setYes(page, 'destinations', 'sol', 'library');
}

async function main() {
  const url = process.env.TINY_DISPATCH_URL ?? 'http://127.0.0.1:4177/#/tiny-dispatch';
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
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForSelector('.td-page', { timeout: 5000 });

    const shell = await page.evaluate(() => ({
      scrollX: window.scrollX,
      docW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '',
      title: document.querySelector('h1')?.textContent,
      state: window.__tinyDispatchState
    }));
    assert(shell.docW <= shell.innerW + 1, `tiny dispatch has horizontal overflow: ${JSON.stringify(shell)}`);
    assert(shell.viewport.includes('user-scalable=no'), `viewport does not disable zoom: ${JSON.stringify(shell)}`);
    assert(shell.title?.includes('첫 배달'), `unexpected title: ${JSON.stringify(shell)}`);
    assert((await page.locator('.td-courier-card').count()) === 3, 'first board should render three courier cards');
    assert((await page.locator('.td-grid').count()) === 0, 'grid UI should not be present in Tiny Dispatch');
    assert((await page.locator('[data-apply-clue]').count()) === 0, 'separate clue apply buttons should not be present');
    assert(await page.getByText('배달 보드').isVisible(), 'board-first heading should be visible');
    const boardBox = await page.locator('.td-board').boundingBox();
    const clueBox = await page.locator('.td-clues').boundingBox();
    assert(boardBox && clueBox && boardBox.height > clueBox.height, `main board should dominate the first screen: board=${JSON.stringify(boardBox)} clues=${JSON.stringify(clueBox)}`);

    await page.locator('[data-clue="c1"]').click();
    const highlightedClass = await page.locator('[data-category="parcels"][data-courier="mina"][data-item="lantern"]').getAttribute('class');
    assert(highlightedClass?.includes('related exact'), `selected direct clue should highlight its exact choice: ${highlightedClass}`);
    await page.locator('[data-category="parcels"][data-courier="mina"][data-item="lantern"]').click();
    const appliedText = await page.locator('[data-category="parcels"][data-courier="mina"][data-item="lantern"]').innerText();
    assert(appliedText.includes('✓'), `direct clue board tap should mark the choice yes, got ${appliedText}`);
    await page.getByRole('button', { name: '리셋' }).click();

    await page.locator('[data-category="parcels"][data-courier="mina"][data-item="lantern"]').click();
    const firstTapText = await page.locator('[data-category="parcels"][data-courier="mina"][data-item="lantern"]').innerText();
    const peerText = await page.locator('[data-category="parcels"][data-courier="mina"][data-item="books"]').innerText();
    assert(firstTapText.includes('✓'), `first tap should visibly confirm a cell, got ${firstTapText}`);
    assert(!peerText.includes('×') && !peerText.includes('✓'), `first tap should not mutate peer cells, got ${peerText}`);
    await page.getByRole('button', { name: '리셋' }).click();

    await fillWrongFirstBoard(page);
    await page.getByRole('button', { name: '확인' }).click();
    await page.waitForFunction(() => window.__tinyDispatchState?.status.includes('아직 맞지 않습니다'), null, {
      timeout: 2000
    });

    await page.getByRole('button', { name: '리셋' }).click();
    await page.waitForFunction(() => window.__tinyDispatchState?.completeRows === 0, null, { timeout: 2000 });

    await solveFirstBoard(page);
    await page.getByRole('button', { name: '확인' }).click();
    await page.waitForFunction(() => window.__tinyDispatchState?.completed.includes('first-board'), null, {
      timeout: 2000
    });

    const finalState = await page.evaluate(() => window.__tinyDispatchState);
    console.log(JSON.stringify({ ok: true, url, shell, finalState }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
