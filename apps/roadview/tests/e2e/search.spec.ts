import { test, expect } from '@playwright/test';

test.describe('RoadView search flow', () => {
  test('searches and filters results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /search with source transparency first/i })).toBeVisible();

    const searchInput = page.getByLabel('Search query');
    await searchInput.fill('report');
    await searchInput.press('Enter');

    await page.waitForURL('**/search**');
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible();
    await expect(page.getByText(/result/)).toBeVisible();

    await page.getByLabel('gov').check();

    const resultCards = page.locator('article');
    await expect(resultCards).toHaveCount(1);
    await expect(resultCards.first()).toContainText('Government report on infrastructure resilience');
  });
});
