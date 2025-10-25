import { test, expect } from "@playwright/test";

test.describe("Operations overview", () => {
  test("renders stubbed metrics in offline mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Operations Overview" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /System uptime/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Agent Health" })).toBeVisible();
    await expect(page.getByText("Runbook Shortcuts")).toBeVisible();
  });
});
