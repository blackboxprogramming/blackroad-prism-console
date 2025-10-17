process.env.SESSION_SECRET = 'test-secret';
process.env.INTERNAL_TOKEN = 'x';
process.env.ALLOW_ORIGINS = 'https://example.com';
process.env.STRIPE_SECRET = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

const request = require('supertest');
const Stripe = require('stripe');

const { app, server } = require('../srv/blackroad-api/server_full.js');

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: '2023-10-16',
});

describe('Billing webhook verification', () => {
  afterAll((done) => {
    server.close(done);
  });

  it('accepts a valid Stripe signature', async () => {
    const payload = JSON.stringify({
      id: 'evt_test_123',
      object: 'event',
      type: 'customer.subscription.updated',
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });

    const res = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});
