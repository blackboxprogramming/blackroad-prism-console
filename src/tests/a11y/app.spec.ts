import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('no serious a11y violations', async ({ page }) => {
  await page.goto('http://localhost:5173');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a','wcag2aa'])
    .exclude('.visually-hidden')
    .analyze();
  expect(results.violations.filter(v => ['serious','critical'].includes(v.impact)).length).toBe(0);
});
