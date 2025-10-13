import { test, expect } from "@playwright/test";

test("blog post hello world is accessible", async ({ page }) => {
  await page.goto("/blog/hello-world.html");
const base = process.env.E2E_BASE || "http://127.0.0.1:5173";

test("blog post hello world is accessible", async ({ page }) => {
  await page.goto(base + "/blog/hello-world");
  await expect(page.getByRole("heading", { name: /Hello World/i })).toBeVisible();
  await expect(page.getByText(/Welcome to Hello World on BlackRoad.io./i)).toBeVisible();
});
