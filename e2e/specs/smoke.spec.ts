import { test, expect } from '@playwright/test';
test('health page', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
});
