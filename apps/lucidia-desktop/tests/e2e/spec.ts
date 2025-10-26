import { test, expect } from '@playwright/test';

test('placeholder app boot', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page.locator('text=Lucidia Desktop')).toBeVisible();
});
