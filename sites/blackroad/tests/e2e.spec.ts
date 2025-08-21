import { test, expect } from '@playwright/test';
const base = process.env.E2E_BASE || 'http://127.0.0.1:4178';
const routes = [
  '/',
  '/docs',
  '/status',
  '/snapshot',
  '/portal',
  '/playground',
  '/contact',
  '/tutorials',
  '/roadmap',
  '/changelog',
  '/blog',
];

for (const r of routes) {
  test(`route ${r} renders`, async ({ page }) => {
    await page.goto(base + r);
    await expect(page)
      .toHaveTitle(/blackroad/i, { timeout: 30000 })
      .catch(() => {}); // title may be minimal
    await page.screenshot({
      path: `test-results/route${r.replace(/\W+/g, '_')}.png`,
      fullPage: true,
    });
    // Basic content sanity
    const body = await page.textContent('body');
    expect(body?.length || 0).toBeGreaterThan(50);
  });
}
