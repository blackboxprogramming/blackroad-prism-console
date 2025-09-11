import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { createPatch } from 'diff';
import { createHash } from 'crypto';
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

  it('rejects paths outside work root', async () => {
    const app = await createServer(':memory:');
    await app.ready();
    const diff = {
      path: '../evil.txt',
      beforeSha: createHash('sha1').update('').digest('hex'),
      afterSha: createHash('sha1').update('bad').digest('hex'),
      patch: createPatch('../evil.txt', '', 'bad')
    };
    const res = await supertest(app.server).post('/diffs/apply').send({ diffs: [diff], message: 'test' });
    expect(res.status).toBe(400);
    await app.close();
  });
});
