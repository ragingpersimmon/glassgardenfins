const { defineConfig } = require('playwright/test');

// Screenshot regression suite (npm run test:visual). Baselines live in
// tests/visual/ and are rendered on the pinned Linux CI runner; see README.
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'visual.spec.cjs',
  snapshotPathTemplate: '{testDir}/visual/{arg}-{platform}{ext}',
  outputDir: 'test-results/visual',
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  // updateSnapshots stays at Playwright's default: a missing baseline fails its
  // test without a retry and saves the render as *-actual.png (CI uploads these;
  // see README), and a changed render fails without overwriting the baseline.
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    reducedMotion: 'reduce',
    timezoneId: 'America/Vancouver',
    locale: 'en-CA'
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css'
    }
  }
});
