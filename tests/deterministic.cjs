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
    const homeTheme = await page.locator('body').evaluate((element) => {
      const style = window.getComputedStyle(element);
      return { fontFamily: style.fontFamily, textTransform: style.textTransform };
    });
    assert.match(homeTheme.fontFamily, /^Arial/i, 'site theme should use Arial');
    assert.strictEqual(homeTheme.textTransform, 'lowercase', 'site theme should render lowercase');

    await checkPageMeta(
      page,
      server.baseUrl,
      '/tank/',
      'The Tank — Little Fin Swim',
      'https://littlefinswim.net/tank/'
    );
    const tankDetails = await page.locator('.spec-list').innerText();
    assert.match(tankDetails, /Hikari Aquarium Solutions Bacto-Surge/i);
    assert.doesNotMatch(tankDetails, /Fluval 207/i);
    assert.match(tankDetails, /CO₂\s+none currently/i);
    assert.match(tankDetails, /Dimensions\s+1 ft × 1 ft × 2\.5 ft/i);
    const purchaseDates = await page.locator('.purchase-day > time').evaluateAll((times) =>
      times.map((time) => time.getAttribute('datetime'))
    );
    assert.deepStrictEqual(purchaseDates, [
      '2026-08-15',
      '2026-07-12',
      '2026-07-11',
      '2026-07-10',
      '2026-07-08',
      '2026-07-07'
    ]);
    assert.strictEqual(
      await page.locator('.purchase-list a[data-amazon-link]').count(),
      16,
      'tank purchase timeline should link all 16 supplied products'
    );

    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/',
      'Journal — Little Fin Swim',
      'https://littlefinswim.net/journal/'
    );

    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/10-aquarium-questions/',
      '10 Aquarium Questions I Keep Coming Back To — Little Fin Swim',
      'https://littlefinswim.net/journal/10-aquarium-questions/'
    );

    await page.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    const journalEntryLink = page.locator(
      '.journal-card__link[href="/journal/10-aquarium-questions/"]'
    );
    assert.strictEqual(await journalEntryLink.count(), 1, 'journal index should list the full entry');
    assert.match(
      await journalEntryLink.locator('.journal-card__title').innerText(),
      /questions I keep/,
      'journal card should preserve uppercase standalone I'
    );
    assert.doesNotMatch(
      await journalEntryLink.locator('.journal-card__excerpt').innerText(),
      /^straight answers/i,
      'journal summary should not use the removed wording'
    );
    await journalEntryLink.click();
    await page.waitForLoadState('domcontentloaded');
    assert.strictEqual(
      new URL(page.url()).pathname,
      '/journal/10-aquarium-questions/',
      'journal card should open the full entry'
    );
    const articleTypography = await page.locator('.entry').evaluate((element) => {
      const style = window.getComputedStyle(element);
      return { fontFamily: style.fontFamily, textTransform: style.textTransform };
    });
    assert.match(
      articleTypography.fontFamily,
      /Literata/i,
      'journal entry should retain its editorial typeface'
    );
    assert.strictEqual(
      articleTypography.textTransform,
      'none',
      'journal entry should retain its original capitalization'
    );

    await page.waitForTimeout(250);

    const productLinks = page.locator('a[data-amazon-link]');
    assert.ok(await productLinks.count(), 'journal should include relevant Amazon product links');
    const untaggedLinks = await productLinks.evaluateAll((links) =>
      links.map((link) => ({
        host: new URL(link.href).hostname,
        tag: new URL(link.href).searchParams.get('tag')
      }))
    );
    assert.ok(
      untaggedLinks.every(({ host, tag }) => host === 'www.amazon.ca' && tag === null),
      'Amazon links should remain untagged until a real Associates ID is configured'
    );
    assert.ok(
      await page.locator('[data-affiliate-disclosure]').isHidden(),
      'affiliate disclosure should remain hidden while monetization is disabled'
    );

    await page.route(`${server.baseUrl}/journal/10-aquarium-questions/`, async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'name="amazon-associate-tag" content=""',
        'name="amazon-associate-tag" content="littlefinswim-20"'
      );
      await route.fulfill({ response, body });
    });
    await page.goto(`${server.baseUrl}/journal/10-aquarium-questions/`, { waitUntil: 'domcontentloaded' });
    const taggedLinks = await page.locator('a[data-amazon-link]').evaluateAll((links) =>
      links.map((link) => ({
        tag: new URL(link.href).searchParams.get('tag'),
        sponsored: link.relList.contains('sponsored')
      }))
    );
    assert.ok(
      taggedLinks.every(({ tag, sponsored }) => tag === 'littlefinswim-20' && sponsored),
      'configured Amazon links should include the Associates ID and sponsored relationship'
    );
    assert.ok(
      await page.locator('[data-affiliate-disclosure]').isVisible(),
      'affiliate disclosure should be visible when monetization is enabled'
    );
    await page.unroute(`${server.baseUrl}/journal/10-aquarium-questions/`);

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
    await reducedPage.goto(`${server.baseUrl}/journal/10-aquarium-questions/`, { waitUntil: 'domcontentloaded' });
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
    await noObserverPage.goto(`${server.baseUrl}/journal/10-aquarium-questions/`, { waitUntil: 'domcontentloaded' });
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
