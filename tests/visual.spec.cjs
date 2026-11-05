const { test, expect } = require('playwright/test');
const { startServer } = require('./helpers.cjs');

// Text rendering differs between operating systems, so baselines are rendered on
// Linux CI. VISUAL_ANY_PLATFORM=1 runs the suite elsewhere for local experiments;
// those *-win32/*-darwin baselines are git-ignored.
test.skip(
  process.platform !== 'linux' && !process.env.VISUAL_ANY_PLATFORM,
  'screenshot baselines are rendered on Linux CI'
);

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 }
};

// Pages whose design is stable as journal entries are added: the home hero,
// a full article with its product box and affiliate disclosure, the guide
// series index, and the 404 page.
const SHOTS = [
  { name: 'home', route: '/', viewports: ['desktop', 'mobile'], fullPage: false },
  { name: 'article', route: '/journal/how-much-fish-food/', viewports: ['desktop', 'mobile'], fullPage: true },
  { name: 'guide-series', route: '/journal/10-aquarium-questions/', viewports: ['desktop'], fullPage: true },
  { name: 'not-found', route: '/404.html', viewports: ['desktop'], fullPage: false }
];

// The footer shows the deploy time; pin it so every render reads the same.
const FOOTER_STAMP = /<time class="site-footer__updated" data-site-updated(?: datetime="[^"]*")?>/g;
const PINNED_STAMP = '<time class="site-footer__updated" data-site-updated datetime="2026-09-20T16:48:23Z">';

// The home readout changes whenever the water is tested, and its centred row
// reflows with each value's width, so the readings are pinned rather than masked.
const READOUT_VALUE = /(<div class="readout__item"><dt>([^<]*)<\/dt><dd>)[^<]*(<\/dd>)/g;
const PINNED_READINGS = { GH: '8', KH: '6', pH: '7.2', Temp: '26.2&deg;C' };

function pinDynamicContent(html) {
  return html
    .replace(FOOTER_STAMP, PINNED_STAMP)
    .replace(READOUT_VALUE, (match, open, label, close) =>
      label in PINNED_READINGS ? `${open}${PINNED_READINGS[label]}${close}` : match
    );
}

let server;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

test.beforeEach(async ({ page }) => {
  // Renders stay hermetic: only the local site loads, so system fallback fonts
  // stand in for Google Fonts and analytics and video never reach the network.
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    if (!url.startsWith(`${server.baseUrl}/`) || url.endsWith('.mp4')) return route.abort();
    if (request.resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const body = pinDynamicContent(await response.text());
    return route.fulfill({ response, body });
  });
});

for (const shot of SHOTS) {
  for (const viewport of shot.viewports) {
    test(`${shot.name} (${viewport})`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[viewport]);
      await page.goto(`${server.baseUrl}${shot.route}`, { waitUntil: 'load' });
      await expect(page).toHaveScreenshot(`${shot.name}-${viewport}.png`, {
        fullPage: shot.fullPage,
        // The hero footage changes as the tank does; its frame is decorative.
        mask: [page.locator('video')],
        maskColor: '#142C27'
      });
    });
  }
}
