const assert = require('assert');
const { chromium } = require('playwright');
const { startServer, createSeededRandom } = require('./helpers.cjs');

const ROUTES = ['/', '/tank/', '/journal/'];
const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 }
];

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

async function runScenario(browser, baseUrl, random, iteration) {
  const routePath = pick(random, ROUTES);
  const viewport = pick(random, VIEWPORTS);
  const reducedMotion = random() < 0.5 ? 'reduce' : 'no-preference';
  const blockFonts = random() < 0.5;
  const blockScript = random() < 0.2;
  const delayScript = !blockScript && random() < 0.35;

  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  if (blockFonts) {
    await context.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        await route.abort();
        return;
      }
      await route.continue();
    });
  }

  if (blockScript || delayScript) {
    await context.route('**/script.js', async (route) => {
      if (blockScript) {
        await route.abort();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
  }

  const response = await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded' });
  assert.strictEqual(response && response.status(), 200, `iteration ${iteration}: HTTP must be 200`);

  await page.waitForTimeout(200);

  const textLength = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerText.trim().length : 0;
  });
  assert.ok(textLength > 60, `iteration ${iteration}: page must remain readable`);

  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press('Tab');
  }

  const firstNavLink = page.locator('header .site-nav a').first();
  if (await firstNavLink.count()) {
    await firstNavLink.click();
    await page.waitForLoadState('domcontentloaded');
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);

  assert.strictEqual(pageErrors.length, 0, `iteration ${iteration}: uncaught errors: ${pageErrors.map(String).join('; ')}`);

  await context.close();
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const random = createSeededRandom(1337);

  try {
    for (let i = 0; i < 16; i += 1) {
      await runScenario(browser, server.baseUrl, random, i + 1);
    }

    console.log('Chaos backtests passed with seed 1337.');
  } finally {
    await browser.close();
    await server.close();
  }
}

run().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
