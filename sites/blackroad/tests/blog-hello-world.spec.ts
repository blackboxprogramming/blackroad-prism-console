import { test, expect } from "@playwright/test";

test("blog post hello world is accessible", async ({ page }) => {
  await page.goto("/blog/hello-world.html");
  await expect(page.getByRole("heading", { name: /Hello World/i })).toBeVisible();
  await expect(page.getByText(/Welcome to Hello World on BlackRoad.io./i)).toBeVisible();
});
