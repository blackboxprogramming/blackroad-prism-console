import { defineConfig } from "@playwright/test";

const host = process.env.E2E_HOST ?? "127.0.0.1";
const port = Number(process.env.E2E_PORT ?? 5173);
const baseURL = process.env.E2E_BASE ?? `http://${host}:${port}`;

if (!process.env.E2E_BASE) {
  process.env.E2E_BASE = baseURL;
}

export default defineConfig({
  testDir: "tests",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --host ${host} --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
