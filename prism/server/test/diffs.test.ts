import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { createServer } from '../src/server';

describe('diffs API', () => {
  it('proposes diff', async () => {
    const app = await createServer(':memory:');
    await app.ready();
    const res = await supertest(app.server).post('/diffs/propose').send({ files: { 'hello.txt': 'hi' } });
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].patch).toContain('hi');
    await app.close();
  });
});
