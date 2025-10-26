import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
  use: {
    baseURL: 'http://localhost:5173'
  }
});
