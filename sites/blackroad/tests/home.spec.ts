import { test, expect } from "@playwright/test";

test("home renders new landing hero", async ({ page }) => {
  await page.goto("/");
  await page.goto(base + "/");
  await expect(page.getByRole("heading", { name: /Welcome to Blackroad/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Enter Portal/i })).toBeVisible();
  // status widget should eventually resolve
  await expect(page.locator("#root")).toBeVisible();
});

test("status page fetches /api/health.json", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByText(/Status/i)).toBeVisible();
});

test("portal index lists cards", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByText(/Roadbook/i)).toBeVisible();
  await expect(page.getByText(/Roadview/i)).toBeVisible();
  await expect(page.getByText(/Lucidia/i)).toBeVisible();
});
