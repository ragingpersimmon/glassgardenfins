const assert = require('assert');
const { chromium } = require('playwright');
const { startServer } = require('./helpers.cjs');
const { siteOrigin: SITE_ORIGIN, amazonAssociateTag: AMAZON_TAG } = require('../site-config.json');

const QUESTION_ENTRIES = [
  ['/journal/how-much-fish-food/', 'How Much Fish Food Is the Right Amount? — Glass Garden Fins'],
  ['/journal/how-much-sun-do-fish-need/', 'How Much Sun Do Fish Need? — Glass Garden Fins'],
  ['/journal/what-happened-to-my-shrimps-skin/', 'What Happened to My Shrimp’s Skin? — Glass Garden Fins'],
  ['/journal/why-is-my-fish-staying-at-the-bottom/', 'Why Is My Fish Staying at the Bottom of the Tank? — Glass Garden Fins'],
  ['/journal/why-is-my-fish-swimming-at-the-top/', 'Why Is My Fish Swimming at the Top of the Tank? — Glass Garden Fins'],
  ['/journal/how-often-should-you-change-aquarium-water/', 'How Often Should You Change Aquarium Water? — Glass Garden Fins'],
  ['/journal/why-is-my-aquarium-water-cloudy/', 'Why Is My Aquarium Water Cloudy? — Glass Garden Fins'],
  ['/journal/is-my-aquarium-filter-big-enough/', 'How Do I Know If My Aquarium Filter Is Big Enough? — Glass Garden Fins'],
  ['/journal/how-many-fish-can-i-put-in-my-aquarium/', 'How Many Fish Can I Put in My Aquarium? — Glass Garden Fins'],
  ['/journal/why-are-my-aquarium-plants-turning-brown/', 'Why Are My Aquarium Plants Turning Brown? — Glass Garden Fins']
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

async function assertColorHierarchy(page, label) {
  const accentColors = await page.locator('.wordmark, .section-title').evaluateAll((elements) =>
    elements.map((element) => window.getComputedStyle(element).color)
  );
  assert.ok(
    accentColors.length > 0 && accentColors.every((color) => color === 'rgb(240, 163, 74)'),
    `${label}: brand and section titles should retain the orange identity`
  );

  const bodyCopy = page.locator('.entry p:not(.entry__closing), .page-hero__lead').first();
  if (await bodyCopy.count()) {
    assert.notStrictEqual(
      await bodyCopy.evaluate((element) => window.getComputedStyle(element).color),
      'rgb(240, 163, 74)',
      `${label}: body copy should remain visually distinct from orange headings`
    );
  }
}

async function run() {
  const updateInstant = '2026-09-20T16:48:23.000Z';
  const server = await startServer({
    lastModified: new Date(updateInstant).toUTCString()
  });
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ timezoneId: 'America/Vancouver' });
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    const standardPageRoutes = [
      '/tank/',
      '/journal/',
      '/species/',
      '/privacy/',
      '/journal/how-much-fish-food/'
    ];
    const collectPageHeaderMetrics = async (viewport) => {
      await page.setViewportSize(viewport);
      const metrics = [];
      for (const route of standardPageRoutes) {
        await page.goto(`${server.baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        metrics.push(await page.evaluate(() => {
          const header = document.querySelector('.site-header__inner');
          const hero = document.querySelector('.page-hero');
          const nav = document.querySelector('.site-nav');
          const headerStyle = window.getComputedStyle(header);
          const heroStyle = window.getComputedStyle(hero);
          return {
            headerHeight: Math.round(header.getBoundingClientRect().height),
            headerPaddingTop: headerStyle.paddingTop,
            headerPaddingBottom: headerStyle.paddingBottom,
            heroPaddingTop: heroStyle.paddingTop,
            heroPaddingBottom: heroStyle.paddingBottom,
            navGap: window.getComputedStyle(nav).gap
          };
        }));
      }
      return metrics;
    };
    for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 640 }]) {
      const [expectedMetrics, ...remainingMetrics] = await collectPageHeaderMetrics(viewport);
      assert.ok(
        remainingMetrics.every((metrics) =>
          JSON.stringify(metrics) === JSON.stringify(expectedMetrics)
        ),
        `${viewport.width}px: shared page header spacing should be identical across routes`
      );
      for (const route of ['/', ...standardPageRoutes]) {
        await page.goto(`${server.baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        const dividerSpacing = await page.evaluate(() => {
          const siteHeader = document.querySelector('.site-header');
          const wordmark = document.querySelector('.wordmark');
          const navLinks = [...document.querySelectorAll('.site-nav a')];
          const eyebrow = document.querySelector('main .eyebrow');
          const textBounds = (element) => {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const bounds = [];
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(walker.currentNode);
              bounds.push(range.getBoundingClientRect());
            }
            return {
              top: Math.min(...bounds.map((bound) => bound.top)),
              bottom: Math.max(...bounds.map((bound) => bound.bottom))
            };
          };
          const headerBottom = siteHeader.getBoundingClientRect().bottom;
          const upperContentBottom = Math.max(
            textBounds(wordmark).bottom,
            ...navLinks.map((link) => textBounds(link).bottom)
          );
          return {
            above: headerBottom - upperContentBottom,
            below: textBounds(eyebrow).top - headerBottom
          };
        });
        assert.ok(
          Math.abs(dividerSpacing.above - dividerSpacing.below) <= 1.5,
          `${route} at ${viewport.width}px: spacing should mirror above and below the header line`
        );
      }
    }
    await page.setViewportSize({ width: 1280, height: 720 });

    await checkPageMeta(
      page,
      server.baseUrl,
      '/',
      'Glass Garden Fins — a planted tank journal',
      `${SITE_ORIGIN}/`
    );
    const homeTheme = await page.locator('body').evaluate((element) => {
      const style = window.getComputedStyle(element);
      return { fontFamily: style.fontFamily, textTransform: style.textTransform };
    });
    assert.match(homeTheme.fontFamily, /^Arial/i, 'site theme should use Arial');
    assert.strictEqual(homeTheme.textTransform, 'lowercase', 'site theme should render lowercase');
    const homeMontage = page.locator('[data-hero-montage]');
    assert.strictEqual(
      await homeMontage.locator('video[data-hero-clip] source:is([src^="/assets/media/"], [data-src^="/assets/media/"])').count(),
      1,
      'homepage should show one locally hosted Corydoras video'
    );
    assert.strictEqual(
      await homeMontage.locator('source:is([src^="/assets/media/corydoras-"], [data-src^="/assets/media/corydoras-"])').count(),
      1,
      'homepage should show only the Corydoras group-foraging clip'
    );
    assert.strictEqual(
      await homeMontage.locator('video[data-hero-clip][autoplay][muted][loop][preload="metadata"]').count(),
      1,
      'homepage video should autoplay silently with metadata-only preload'
    );
    await page.waitForFunction(() => !document.querySelector('[data-hero-clip]').paused);
    assert.strictEqual(
      await homeMontage.locator('.hero-montage__clip.is-active').count(),
      1,
      'homepage montage should expose one active clip'
    );
    const montageToggle = page.locator('[data-hero-toggle]');
    await montageToggle.click();
    assert.strictEqual(await montageToggle.getAttribute('aria-pressed'), 'true');
    assert.strictEqual(await montageToggle.getAttribute('aria-label'), 'Play tank video montage');
    assert.strictEqual(
      await homeMontage.locator('button, figcaption').count(),
      0,
      'homepage montage should not show a pause button or caption'
    );
    await assertColorHierarchy(page, 'homepage');

    await checkPageMeta(
      page,
      server.baseUrl,
      '/tank/',
      'The Tank — Glass Garden Fins',
      `${SITE_ORIGIN}/tank/`
    );
    const tankDetails = await page.locator('.spec-list').innerText();
    assert.match(tankDetails, /Hikari Aquarium Solutions Bacto-Surge/i);
    assert.doesNotMatch(tankDetails, /Fluval 207/i);
    assert.match(tankDetails, /CO₂ injection\s+no active system/i);
    assert.match(tankDetails, /CO₂ monitoring\s+Pawfly glass CO₂ drop checker/i);
    assert.doesNotMatch(tankDetails, /\(in use\)/i);
    assert.match(tankDetails, /Dimensions\s+1 ft × 1 ft × 2\.5 ft/i);
    assert.strictEqual(
      await page.locator('.tank-media-grid img[src^="/assets/media/"]').count(),
      0,
      'tank page should replace its contextual photographs with video'
    );
    assert.strictEqual(
      await page.locator('.tank-media-grid video source:is([src="/assets/media/red-bristlenose-pleco-foraging.mp4"], [data-src="/assets/media/red-bristlenose-pleco-foraging.mp4"])').count(),
      1,
      'tank page should show the Corydoras and red pleco footage first'
    );
    assert.strictEqual(
      await page.locator('.tank-media-grid video source:is([src="/assets/media/shrimp-open-water-swimming.mp4"], [data-src="/assets/media/shrimp-open-water-swimming.mp4"])').count(),
      1,
      'tank page should show the swimming shrimp footage second'
    );
    assert.strictEqual(
      await page.locator('.tank-media-grid video[autoplay][muted][loop]:not([controls])').count(),
      2,
      'tank videos should autoplay silently without browser controls'
    );
    assert.strictEqual(
      await page.locator('.tank-media-grid figcaption').count(),
      0,
      'tank videos should not show captions'
    );
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
    assert.strictEqual(
      await page.locator('.purchase-list a[data-amazon-link] > img[src^="/assets/products/"]').count(),
      0,
      'tank purchases should not show placeholder product artwork'
    );
    const currentLivestock = await page.locator('.stocking-plan--current').innerText();
    assert.match(currentLivestock, /1 red bristlenose shortfin pleco/i);
    assert.match(currentLivestock, /6 gold laser Corydoras/i);
    await assertColorHierarchy(page, 'tank page');

    await checkPageMeta(
      page,
      server.baseUrl,
      '/species/',
      'Species — Glass Garden Fins',
      `${SITE_ORIGIN}/species/`
    );
    assert.strictEqual(
      await page.locator('.site-nav a[href="/species/"][aria-current="page"]').count(),
      1,
      'species page should identify its primary navigation item'
    );
    assert.deepStrictEqual(
      await page.locator('.site-nav a').allInnerTexts(),
      ['the tank', 'journal', 'species'],
      'species should appear to the right of journal in primary navigation'
    );
    assert.strictEqual(
      await page.locator('.species-card').count(),
      12,
      'species page should show every current fish, shrimp, crab, and snail group'
    );
    assert.strictEqual(
      await page.locator('.species-video-placeholder').count(),
      5,
      'species without original footage should retain a reserved video position'
    );
    assert.strictEqual(
      await page.locator('.species-card video').count(),
      7,
      'the catalog should show each selected original species video once'
    );
    assert.strictEqual(
      await page.locator('.species-card video[autoplay][muted][loop][playsinline]:not([controls])').count(),
      7,
      'species videos should autoplay silently without visible playback controls'
    );
    assert.strictEqual(
      await page.locator('.video-playback-toggle, .video-control-host').count(),
      0,
      'video playback overlays should not be rendered'
    );
    assert.strictEqual(
      await page.locator('.species-card video[data-lazy-video][preload="none"] source[data-src]').count(),
      6,
      'offscreen species videos should remain deferred'
    );
    const firstSpeciesVideo = page.locator('.species-card video[data-lazy-video]').first();
    await firstSpeciesVideo.scrollIntoViewIfNeeded();
    await firstSpeciesVideo.waitFor({ state: 'visible' });
    await page.waitForFunction(
      () => {
        const video = document.querySelector('.species-card video[data-lazy-video]');
        return video && video.currentSrc && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      }
    );
    assert.ok(
      await firstSpeciesVideo.evaluate((video) => !video.paused),
      'a visible species video should load and autoplay'
    );
    const speciesNames = await page.locator('.species-card__title').allInnerTexts();
    for (const expectedName of [
      'Thai micro spider crab',
      'Rainbow emperor tetra',
      'Sanke koi swordtail',
      'Red bristlenose shortfin pleco',
      'Gold laser Corydoras',
      'Amano shrimp',
      'Bamboo shrimp',
      'Yellow Poso rabbit snail',
      'King Koopa snail',
      'Magenta apple snail',
      'Red racer snail',
      'White Hercules snail'
    ]) {
      assert.ok(
        speciesNames.some((name) => name.toLowerCase() === expectedName.toLowerCase()),
        `species page should include ${expectedName}`
      );
    }
    const speciesSchema = JSON.parse(
      await page.locator('script[data-site-schema]').textContent()
    );
    assert.strictEqual(
      speciesSchema.mainEntity?.numberOfItems,
      12,
      'species schema should enumerate all current species'
    );
    for (const [slug, expectedCount] of [
      ['sanke-koi-swordtail', '6 residents'],
      ['amano-shrimp', '6 residents'],
      ['bamboo-shrimp', '3 residents'],
      ['yellow-poso-rabbit-snail', '2 residents'],
      ['king-koopa-snail', '2 residents'],
      ['magenta-apple-snail', '2 residents'],
      ['red-racer-snail', '2 residents'],
      ['white-hercules-snail', '2 residents']
    ]) {
      assert.strictEqual(
        await page.locator(`#${slug} .species-card__count`).innerText(),
        expectedCount,
        `${slug} should show the current resident count`
      );
    }
    await assertColorHierarchy(page, 'species page');

    await checkPageMeta(
      page,
      server.baseUrl,
      '/privacy/',
      'Privacy & Disclosure — Glass Garden Fins',
      `${SITE_ORIGIN}/privacy/`
    );
    const affiliateStatus = await page.locator('[data-affiliate-status]').innerText();
    if (AMAZON_TAG) {
      assert.match(
        affiliateStatus,
        /sponsored affiliate links/i,
        'privacy page should describe the tagged affiliate state'
      );
    } else {
      assert.match(
        affiliateStatus,
        /does not currently earn a commission/i,
        'privacy page should describe the current untagged affiliate state'
      );
    }

    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/',
      'Journal — Glass Garden Fins',
      `${SITE_ORIGIN}/journal/`
    );

    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/10-aquarium-questions/',
      '10 Aquarium Questions — Glass Garden Fins',
      `${SITE_ORIGIN}/journal/10-aquarium-questions/`
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
      'First Residents: Amano Shrimp Are In — Glass Garden Fins',
      `${SITE_ORIGIN}/journal/first-residents-amano-shrimp/`
    );
    assert.strictEqual(
      await page.locator('video source:is([src="/assets/media/amano-shrimp-stabilized.mp4"], [data-src="/assets/media/amano-shrimp-stabilized.mp4"])').count(),
      1,
      'Amano entry should include the stabilized shrimp clip'
    );
    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/detritus-worms/',
      'Detritus Worms, and What They Were Actually Telling Me — Glass Garden Fins',
      `${SITE_ORIGIN}/journal/detritus-worms/`
    );
    await checkPageMeta(
      page,
      server.baseUrl,
      '/journal/dialing-in-before-stocking/',
      'Dialing In Before Anything Goes In — Glass Garden Fins',
      `${SITE_ORIGIN}/journal/dialing-in-before-stocking/`
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
    if (septemberEntryPublished) {
      await page.goto(`${server.baseUrl}/journal/september-15-stocking-update/`, {
        waitUntil: 'domcontentloaded'
      });
      assert.strictEqual(
        await page.locator('.entry video[autoplay][muted][loop][playsinline]:not([controls])').count(),
        2,
        'stocking entry should include two control-free videos from the latest stocking'
      );
      assert.strictEqual(
        await page.locator('.entry-media-grid img').count(),
        4,
        'stocking entry should include four corrected arrival photos'
      );
      assert.strictEqual(
        await page.locator('source[src="/assets/media/stocking-shrimp-stabilized.mp4"]').count(),
        0,
        'stocking entry should not reuse the older shrimp clip'
      );
      const stockingVideoLayout = await page.locator('.entry video').evaluateAll((videos) =>
        videos.map((video) => {
          const rect = video.getBoundingClientRect();
          const style = window.getComputedStyle(video);
          return {
            display: style.display,
            objectFit: style.objectFit,
            ratio: rect.width / rect.height,
            width: rect.width
          };
        })
      );
      for (const video of stockingVideoLayout) {
        assert.strictEqual(video.display, 'block', 'journal videos should not use inline fallback sizing');
        assert.strictEqual(video.objectFit, 'cover', 'journal videos should fill their media frame');
        assert.ok(
          Math.abs(video.ratio - (16 / 9)) < 0.02,
          `journal video should render at 16:9, received ${video.ratio}`
        );
        assert.ok(
          video.width >= 760,
          `journal video should use the wider desktop article canvas, received ${video.width}px`
        );
      }
      await page.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    }
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
    assert.strictEqual(desktopJournalLayout.columns, 1, 'journal archive should use one entry per row');
    assert.ok(
      Math.abs(desktopJournalLayout.firstWidth - desktopJournalLayout.standardWidth) < 2,
      'every journal card should occupy one desktop grid column'
    );
    assert.ok(desktopJournalLayout.maxCardHeight <= 130, 'desktop journal cards should remain compact');
    assert.ok(desktopJournalLayout.maxTitleLines <= 1.1, 'desktop journal headlines should use one line');
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
    await assertColorHierarchy(page, 'journal article');

    await page.waitForTimeout(250);

    const productLinks = page.locator('a[data-amazon-link]');
    assert.ok(await productLinks.count(), 'journal should include relevant Amazon product links');
    assert.strictEqual(
      await productLinks.locator('img[src^="/assets/products/"]').count(),
      0,
      'journal product links should not show placeholder artwork'
    );
    const amazonLinkTags = await productLinks.evaluateAll((links) =>
      links.map((link) => ({
        host: new URL(link.href).hostname,
        tag: new URL(link.href).searchParams.get('tag')
      }))
    );
    if (AMAZON_TAG) {
      assert.ok(
        amazonLinkTags.every(({ host, tag }) => host === 'www.amazon.ca' && tag === AMAZON_TAG),
        'Amazon links should carry the configured Associates tag'
      );
      assert.ok(
        await page.locator('[data-affiliate-disclosure]').isVisible(),
        'affiliate disclosure should be visible while monetization is enabled'
      );
    } else {
      assert.ok(
        amazonLinkTags.every(({ host, tag }) => host === 'www.amazon.ca' && tag === null),
        'Amazon links should remain untagged until a real Associates ID is configured'
      );
      assert.ok(
        await page.locator('[data-affiliate-disclosure]').isHidden(),
        'affiliate disclosure should remain hidden while monetization is disabled'
      );
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    const updatedTimestamp = page.locator('[data-site-updated]');
    assert.strictEqual(
      await updatedTimestamp.count(),
      1,
      'footer should show one compact site update timestamp'
    );
    await page.waitForFunction(
      (expected) => document.querySelector('[data-site-updated]')?.dateTime === expected,
      updateInstant
    );
    const pacificTimestampText = await updatedTimestamp.innerText();
    assert.match(
      pacificTimestampText,
      /^updated \d{4}-\d{2}-\d{2} \d{2}:\d{2} p[ds]t$/i,
      'footer should render the update timestamp in the visitor’s Pacific browser time'
    );
    assert.strictEqual(
      await updatedTimestamp.getAttribute('datetime'),
      updateInstant,
      'footer update timestamp should expose the server modification instant'
    );
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
      '/species/',
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
        `${SITE_ORIGIN}${route}`
      );
      const entryProductLinks = page.locator('a[data-amazon-link]');
      assert.ok(
        await entryProductLinks.count() >= 2,
        `${route}: expected at least two contextual Amazon links`
      );
      assert.strictEqual(
        await entryProductLinks.locator('img[src^="/assets/products/"]').count(),
        0,
        `${route}: product recommendations should not show placeholder artwork`
      );
      const articleText = await page.locator('.entry > p:not([data-affiliate-disclosure])').allInnerTexts();
      if (route === '/journal/what-happened-to-my-shrimps-skin/') {
        assert.strictEqual(
          await page.locator('video source:is([src="/assets/media/shrimp-moss-grazing.mp4"], [data-src="/assets/media/shrimp-moss-grazing.mp4"])').count(),
          1,
          'shrimp-care entry should show the moss-grazing shrimp clip'
        );
        assert.strictEqual(
          await page.locator('video[data-duration="PT7.8S"]').count(),
          1,
          'shrimp-care video metadata should match the decoded 7.8-second duration'
        );
      }
      articleWordCounts.push(articleText.join(' ').trim().split(/\s+/).length);
    }
    await page.goto(`${server.baseUrl}/journal/september-15-stocking-update/`, {
      waitUntil: 'domcontentloaded'
    });
    const stockingProductLinks = page.locator('a[data-amazon-link]');
    assert.strictEqual(
      await stockingProductLinks.locator('img[src^="/assets/products/"]').count(),
      0,
      'stocking entry should not show placeholder product artwork'
    );
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
        /name="amazon-associate-tag" content="[^"]*"/,
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

    const easternContext = await browser.newContext({ timezoneId: 'America/Toronto' });
    const easternPage = await easternContext.newPage();
    await easternPage.goto(`${server.baseUrl}/journal/`, { waitUntil: 'domcontentloaded' });
    const easternTimestamp = easternPage.locator('[data-site-updated]');
    await easternPage.waitForFunction(
      (expected) => document.querySelector('[data-site-updated]')?.dateTime === expected,
      updateInstant
    );
    assert.match(
      await easternTimestamp.innerText(),
      /^updated \d{4}-\d{2}-\d{2} \d{2}:\d{2} e[ds]t$/i,
      'footer should use the visitor’s Eastern browser time outside the Pacific zone'
    );
    assert.notStrictEqual(
      await easternTimestamp.innerText(),
      pacificTimestampText,
      'footer should render a different local time in a different browser time zone'
    );
    assert.strictEqual(
      await easternTimestamp.getAttribute('datetime'),
      updateInstant,
      'localized footer timestamps should preserve the same machine-readable instant'
    );
    await easternContext.close();

    const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    const reducedVideoRequests = [];
    reducedPage.on('request', (request) => {
      if (request.url().endsWith('.mp4')) reducedVideoRequests.push(request.url());
    });
    await reducedPage.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await reducedPage.waitForTimeout(200);
    assert.strictEqual(
      await reducedPage.locator('[data-hero-toggle]').getAttribute('aria-pressed'),
      'true',
      'reduced motion mode should initialize the homepage montage as paused'
    );
    assert.ok(
      await reducedPage.locator('[data-hero-clip]').evaluateAll((clips) =>
        clips.every((clip) => clip.paused)
      ),
      'reduced motion mode should not autoplay homepage videos'
    );
    await reducedPage.goto(`${server.baseUrl}/tank/`, { waitUntil: 'networkidle' });
    await reducedPage.goto(`${server.baseUrl}/species/`, { waitUntil: 'networkidle' });
    assert.deepStrictEqual(
      reducedVideoRequests,
      [],
      'reduced motion mode should retain posters without downloading video'
    );
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

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${server.baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForFunction(() => !document.querySelector('[data-hero-clip]').paused);
    assert.strictEqual(
      await mobilePage.locator('[data-hero-toggle]').getAttribute('aria-pressed'),
      'false',
      'mobile viewports should autoplay the homepage video'
    );
    await mobileContext.close();

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
