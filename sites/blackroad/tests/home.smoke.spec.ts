import { test, expect } from "@playwright/test";

test.describe("home smoke", () => {
  test("shows desktop launchers and opens API agent", async ({ page }) => {
    await page.goto("/");

    const apiLauncher = page.getByRole("button", { name: "API" });
    const llmLauncher = page.getByRole("button", { name: "LLM" });

    await expect(apiLauncher).toBeVisible();
    await expect(llmLauncher).toBeVisible();

    await apiLauncher.click();

    await expect(page.getByText(/API Agent/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Run health probe/i })).toBeVisible();
  });
});
