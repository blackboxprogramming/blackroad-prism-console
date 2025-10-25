import { test, expect } from '@playwright/test';

test.describe('BackRoad journeys', () => {
  test('placeholder journeys to be implemented with real backend', async ({ page }) => {
    await page.goto('http://localhost:3000/threads');
    await expect(page).toHaveURL(/threads/);
  });
});
