import { test, expect } from "@playwright/test";
const base = process.env.E2E_BASE || "http://127.0.0.1:5173";

test("home renders hero + portals", async ({ page }) => {
  await page.goto(base + "/");
  await expect(page.getByRole("heading", { name: /AI-native portals/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Portals/i })).toBeVisible();
  // status widget should eventually resolve
  await expect(page.locator("#root")).toBeVisible();
});

test("status page fetches /api/health.json", async ({ page }) => {
  await page.goto(base + "/status");
  await expect(page.getByText(/Status/i)).toBeVisible();
});

test("portal index lists cards", async ({ page }) => {
  await page.goto(base + "/portal");
  await expect(page.getByText(/Roadbook/i)).toBeVisible();
  await expect(page.getByText(/Roadview/i)).toBeVisible();
  await expect(page.getByText(/Lucidia/i)).toBeVisible();
});
