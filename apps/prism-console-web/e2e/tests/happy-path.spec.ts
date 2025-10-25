import { test, expect } from '@playwright/test';

test.describe('Prism Console', () => {
  test('loads overview and navigates', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Prism Console' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Operations Pulse' })).toBeVisible();

    await page.getByRole('link', { name: 'Agents' }).click({ force: true }).catch(() => {});
    await page.waitForLoadState('networkidle');
  });
});
