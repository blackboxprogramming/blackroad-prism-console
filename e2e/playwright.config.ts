import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
