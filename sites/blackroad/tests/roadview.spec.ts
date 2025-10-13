import { test, expect } from "@playwright/test";

test("team dropdown filters items", async ({ page }) => {
  await page.goto("/roadview");
const base = process.env.E2E_BASE || "http://127.0.0.1:5173";

test("team dropdown filters items", async ({ page }) => {
  await page.goto(base + "/roadview");
  await expect(page.getByRole("heading", { name: /RoadView/i })).toBeVisible();
  await page.selectOption(page.getByRole("combobox", { name: "Team" }), "alpha");
  await expect(page.getByText("Quest Engine")).toBeVisible();
  await expect(page.getByText("City Skyline")).toBeHidden();
});
