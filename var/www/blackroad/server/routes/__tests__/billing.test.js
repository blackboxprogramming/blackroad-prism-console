const express = require('express');
const request = require('supertest');
const billing = require('../billing');

test('returns billing information', async () => {
  const app = express();
  app.get('/api/billing', billing.getBilling);
  const res = await request(app).get('/api/billing');
  expect(res.status).toBe(200);
  expect(res.body.billing).toBeDefined();
  expect(Array.isArray(res.body.deployments)).toBe(true);
});
