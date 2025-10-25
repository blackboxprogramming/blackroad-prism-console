import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true
  },
  webServer: {
    command: 'pnpm dev',
    cwd: __dirname,
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
