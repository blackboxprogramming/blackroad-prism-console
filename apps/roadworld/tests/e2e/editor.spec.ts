import { test, expect } from '@playwright/test';

test.describe('RoadWorld Editor', () => {
  test('loads editor chrome', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('RoadWorld')).toBeVisible();
    await expect(page.getByText('Scene Graph')).toBeVisible();
    await expect(page.getByText('Inspector')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
  });
});
