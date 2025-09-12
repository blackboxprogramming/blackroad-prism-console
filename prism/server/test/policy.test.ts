import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { buildServer } from '../src/index.js';

// Simple sanity check for the policy endpoint
// Ensures policy toggling works for approval gating

describe('policy endpoint', () => {
  it('updates write policy', async () => {
    const app = buildServer();
    await app.listen({ port: 0 });
    await supertest(app.server)
      .put('/policy')
      .send({ write: 'review' })
      .expect(200);
    const res = await supertest(app.server).get('/policy');
    await app.close();
    expect(res.body.write).toBe('review');
  });
});
