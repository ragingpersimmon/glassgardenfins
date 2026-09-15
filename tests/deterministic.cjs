const assert = require('assert');
const { chromium } = require('playwright');
const { startServer } = require('./helpers.cjs');

const QUESTION_ENTRIES = [
  ['/journal/how-much-fish-food/', 'How Much Fish Food Is the Right Amount? — Little Fin Swim'],
  ['/journal/how-much-sun-do-fish-need/', 'How Much Sun Do Fish Need? — Little Fin Swim'],
  ['/journal/what-happened-to-my-shrimps-skin/', 'What Happened to My Shrimp’s Skin? — Little Fin Swim'],
  ['/journal/why-is-my-fish-staying-at-the-bottom/', 'Why Is My Fish Staying at the Bottom of the Tank? — Little Fin Swim'],
  ['/journal/why-is-my-fish-swimming-at-the-top/', 'Why Is My Fish Swimming at the Top of the Tank? — Little Fin Swim'],
  ['/journal/how-often-should-you-change-aquarium-water/', 'How Often Should You Change Aquarium Water? — Little Fin Swim'],
  ['/journal/why-is-my-aquarium-water-cloudy/', 'Why Is My Aquarium Water Cloudy? — Little Fin Swim'],
  ['/journal/is-my-aquarium-filter-big-enough/', 'How Do I Know If My Aquarium Filter Is Big Enough? — Little Fin Swim'],
  ['/journal/how-many-fish-can-i-put-in-my-aquarium/', 'How Many Fish Can I Put in My Aquarium? — Little Fin Swim'],
  ['/journal/why-are-my-aquarium-plants-turning-brown/', 'Why Are My Aquarium Plants Turning Brown? — Little Fin Swim']
];

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
      '/privacy/',
      'Privacy & Disclosure — Little Fin Swim',
      'https://littlefinswim.net/privacy/'
    );
    assert.match(
      await page.locator('[data-affiliate-status]').innerText(),
      /does not currently earn a commission/i,
      'privacy page should describe the current untagged affiliate state'
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
      '10 Aquarium Questions — Little Fin Swim',
      'https://littlefinswim.net/journal/10-aquarium-questions/'
    );
    assert.strictEqual(
      await page.locator('.journal-card__link').count(),
      10,
      'question-series landing page should link ten standalone entries'
    );
    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/first-residents-amano-shrimp/',
      'First Residents: Amano Shrimp Are In — Little Fin Swim',
      'https://littlefinswim.net/journal/first-residents-amano-shrimp/'
    );
    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/detritus-worms/',
      'Detritus Worms, and What They Were Actually Telling Me — Little Fin Swim',
      'https://littlefinswim.net/journal/detritus-worms/'
    );
    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/dialing-in-before-stocking/',
      'Dialing In Before Anything Goes In — Little Fin Swim',
      'https://littlefinswim.net/journal/dialing-in-before-stocking/'
    );

    await page.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    const journalDates = await page.locator('.journal-card time').evaluateAll((times) =>
      times.map((time) => time.getAttribute('datetime'))
    );
    const septemberEntryPublished = journalDates[0] === '2026-09-15';
    const expectedJournalDates = [
      '2026-08-21',
      '2026-08-20',
      '2026-08-19',
      '2026-08-18',
      '2026-08-17',
      '2026-08-16',
      '2026-08-15',
      '2026-08-14',
      '2026-08-13',
      '2026-08-12',
      '2026-08-09',
      '2026-07-14',
      '2026-06-06'
    ];
    if (septemberEntryPublished) expectedJournalDates.unshift('2026-09-15');
    assert.deepStrictEqual(
      journalDates,
      expectedJournalDates,
      'journal index should list every entry newest first'
    );
    assert.strictEqual(
      await page.locator('.journal-card__link').count(),
      expectedJournalDates.length,
      'journal index should expose one dedicated link for every published entry'
    );
    assert.strictEqual(
      await page.locator('.entry__section').count(),
      0,
      'journal index should not embed full article content'
    );
    assert.strictEqual(
      await page.locator('.journal-card__excerpt, .journal-card__cta').count(),
      0,
      'journal index should remain a compact headline archive'
    );
    const desktopJournalLayout = await page.locator('.journal-grid').evaluate((grid) => {
      const cards = Array.from(grid.querySelectorAll('.journal-card'));
      const gridStyle = window.getComputedStyle(grid);
      const firstCard = cards[0].getBoundingClientRect();
      const secondCard = cards[1].getBoundingClientRect();
      const titleLineHeights = cards.map((card) => {
        const title = card.querySelector('.journal-card__title');
        const style = window.getComputedStyle(title);
        return title.getBoundingClientRect().height / Number.parseFloat(style.lineHeight);
      });
      return {
        columns: gridStyle.gridTemplateColumns.split(' ').length,
        firstWidth: firstCard.width,
        standardWidth: secondCard.width,
        maxCardHeight: Math.max(...cards.map((card) => card.getBoundingClientRect().height)),
        maxTitleLines: Math.max(...titleLineHeights)
      };
    });
    assert.strictEqual(desktopJournalLayout.columns, 2, 'journal archive should use two columns on desktop');
    assert.ok(
      Math.abs(desktopJournalLayout.firstWidth - desktopJournalLayout.standardWidth) < 2,
      'every journal card should occupy one desktop grid column'
    );
    assert.ok(desktopJournalLayout.maxCardHeight <= 160, 'desktop journal cards should remain compact');
    assert.ok(desktopJournalLayout.maxTitleLines <= 2.1, 'journal headlines should use at most two lines');
    const journalEntryLink = page.locator('.journal-card__link[href="/journal/how-much-fish-food/"]');
    assert.strictEqual(await journalEntryLink.count(), 1, 'journal index should list the latest question');
    await journalEntryLink.click();
    await page.waitForLoadState('domcontentloaded');
    assert.strictEqual(
      new URL(page.url()).pathname,
      '/journal/how-much-fish-food/',
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

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    const undersizedNavigationTargets = await page.locator(
      '.wordmark, .site-nav a, .journal-card__link, .site-footer a'
    ).evaluateAll((links) => links
      .map((link) => {
        const rect = link.getBoundingClientRect();
        return { text: link.textContent.trim(), width: rect.width, height: rect.height };
      })
      .filter(({ width, height }) => width < 44 || height < 44));
    assert.deepStrictEqual(
      undersizedNavigationTargets,
      [],
      `mobile navigation targets should be at least 44×44: ${JSON.stringify(undersizedNavigationTargets)}`
    );
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    assert.strictEqual(hasHorizontalOverflow, false, 'journal should not overflow horizontally at 390px');
    const mobileJournalLayout = await page.locator('.journal-grid').evaluate((grid) => ({
      columns: window.getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      maxCardHeight: Math.max(
        ...Array.from(grid.querySelectorAll('.journal-card'))
          .map((card) => card.getBoundingClientRect().height)
      )
    }));
    assert.strictEqual(mobileJournalLayout.columns, 1, 'journal archive should use one column on mobile');
    assert.ok(mobileJournalLayout.maxCardHeight <= 130, 'mobile journal cards should remain compact');

    await page.setViewportSize({ width: 320, height: 640 });
    for (const route of [
      '/',
      '/tank/',
      '/privacy/',
      '/journal/',
      '/journal/how-much-fish-food/'
    ]) {
      await page.goto(`${server.baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      const mobileLayout = await page.evaluate(() => {
        const heading = document.querySelector('h1');
        const targets = Array.from(document.querySelectorAll(
          '.wordmark, .site-nav a, .journal-card__link, .site-footer a'
        )).map((link) => {
          const rect = link.getBoundingClientRect();
          return { text: link.textContent.trim(), width: rect.width, height: rect.height };
        });
        return {
          headingTop: heading ? heading.getBoundingClientRect().top : Number.POSITIVE_INFINITY,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          undersizedTargets: targets.filter(({ width, height }) => width < 44 || height < 44)
        };
      });
      assert.strictEqual(mobileLayout.overflow, false, `${route}: must not overflow at 320px`);
      assert.ok(mobileLayout.headingTop < 260, `${route}: heading should remain above the fold`);
      assert.deepStrictEqual(
        mobileLayout.undersizedTargets,
        [],
        `${route}: mobile navigation targets should be at least 44×44`
      );
    }

    const articleWordCounts = [];
    for (const [route, title] of QUESTION_ENTRIES) {
      await checkPageMeta(
        page,
        server.baseUrl,
        route,
        title,
        `https://littlefinswim.net${route}`
      );
      assert.ok(
        await page.locator('a[data-amazon-link]').count() >= 2,
        `${route}: expected at least two contextual Amazon links`
      );
      const articleText = await page.locator('.entry > p:not([data-affiliate-disclosure])').allInnerTexts();
      articleWordCounts.push(articleText.join(' ').trim().split(/\s+/).length);
    }
    assert.ok(
      Math.min(...articleWordCounts) >= 300,
      `question entries should each contain at least 300 words: ${articleWordCounts.join(', ')}`
    );
    assert.ok(
      Math.max(...articleWordCounts) / Math.min(...articleWordCounts) <= 1.35,
      `question entry lengths should remain comparable: ${articleWordCounts.join(', ')}`
    );

    const latestQuestionUrl = `${server.baseUrl}/journal/how-much-fish-food/`;
    await page.route(latestQuestionUrl, async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'name="amazon-associate-tag" content=""',
        'name="amazon-associate-tag" content="littlefinswim-20"'
      );
      await route.fulfill({ response, body });
    });
    await page.goto(latestQuestionUrl, { waitUntil: 'domcontentloaded' });
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
    await page.unroute(latestQuestionUrl);

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
    await reducedPage.goto(`${server.baseUrl}/journal/how-much-fish-food/`, { waitUntil: 'domcontentloaded' });
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
    await noObserverPage.goto(`${server.baseUrl}/journal/how-much-fish-food/`, { waitUntil: 'domcontentloaded' });
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
