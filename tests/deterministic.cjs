const assert = require('assert');
const { chromium } = require('playwright');
const { startServer } = require('./helpers.cjs');

async function checkPageMeta(page, baseUrl, path, expectedTitle, expectedCanonical) {
  const res = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  assert.strictEqual(res && res.status(), 200, `${path}: expected HTTP 200`);

  const title = await page.title();
  assert.strictEqual(title, expectedTitle, `${path}: title mismatch`);

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  assert.strictEqual(canonical, expectedCanonical, `${path}: canonical mismatch`);

  const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
  assert.strictEqual(ogUrl, expectedCanonical, `${path}: og:url mismatch`);

  const navCount = await page.locator('header .site-nav a').count();
  assert.ok(navCount >= 2, `${path}: expected navigation links`);
}

async function run() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await checkPageMeta(
      page,
      server.baseUrl,
      '/',
      'Little Fin Swim — a planted tank journal',
      'https://littlefinswim.net/'
    );

    await checkPageMeta(
      page,
      server.baseUrl,
      '/tank/',
      'The Tank — Little Fin Swim',
      'https://littlefinswim.net/tank/'
    );

    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/',
      'Journal — Little Fin Swim',
      'https://littlefinswim.net/journal/'
    );

    await page.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    const allVisibleAfterScroll = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.entry')).every((el) => {
        const computed = window.getComputedStyle(el);
        return Number.parseFloat(computed.opacity) >= 0.99;
      })
    );
    assert.ok(allVisibleAfterScroll, 'journal entries should be visible after scroll');

    await context.close();

    const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    await reducedPage.waitForTimeout(200);

    const reducedMotionVisible = await reducedPage.evaluate(() =>
      Array.from(document.querySelectorAll('.entry')).every((el) => {
        const computed = window.getComputedStyle(el);
        return Number.parseFloat(computed.opacity) >= 0.99;
      })
    );
    assert.ok(reducedMotionVisible, 'reduced motion mode should disable hidden entries');
    await reducedContext.close();

    const noObserverContext = await browser.newContext();
    await noObserverContext.addInitScript(() => {
      Object.defineProperty(window, 'IntersectionObserver', {
        configurable: true,
        writable: true,
        value: undefined
      });
    });
    const noObserverPage = await noObserverContext.newPage();
    await noObserverPage.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    await noObserverPage.waitForTimeout(200);

    const noObserverVisible = await noObserverPage.evaluate(() =>
      Array.from(document.querySelectorAll('.entry')).every((el) => {
        const computed = window.getComputedStyle(el);
        return Number.parseFloat(computed.opacity) >= 0.99;
      })
    );
    assert.ok(noObserverVisible, 'entries should remain visible without IntersectionObserver');
    await noObserverContext.close();

    assert.strictEqual(pageErrors.length, 0, `expected no page errors, got: ${pageErrors.map(String).join('; ')}`);

    console.log('Deterministic tests passed.');
  } finally {
    await browser.close();
    await server.close();
  }
}

run().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
