import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'node tools/static-server.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000
  }
});
