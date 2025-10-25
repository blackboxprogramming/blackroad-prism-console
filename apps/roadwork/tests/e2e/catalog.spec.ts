import { test, expect } from '@playwright/test';

test.skip('catalog to lesson journey (mocked)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/RoadWork/);
});
