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
  // CI never writes baselines, so a retry cannot pass against a render it just saved.
  updateSnapshots: process.env.CI ? 'none' : 'missing',
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
