import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildServer } from '../src/index';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('policy guard', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-policy-'));
  let app = buildServer();
  beforeAll(async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(tmp);
    await app.ready();
  });
  afterAll(async () => { await app.close(); });

  it('playground forbids write', async () => {
    await request(app.server).put('/mode').send({ mode: 'playground' });
    const res = await request(app.server).post('/diffs/apply').send({});
    expect(res.status).toBe(403);
  });
  it('dev returns pending', async () => {
    await request(app.server).put('/mode').send({ mode: 'dev' });
    const res = await request(app.server).post('/diffs/apply').send({});
    expect(res.body.status).toBe('pending');
  });
  it('trusted writes', async () => {
    await request(app.server).put('/mode').send({ mode: 'trusted' });
    const res = await request(app.server).post('/diffs/apply').send({});
    expect(res.body.status).toBe('applied');
  });
  it('mode persists', async () => {
    await request(app.server).put('/mode').send({ mode: 'dev' });
    const res = await request(app.server).get('/mode');
    expect(res.body.currentMode).toBe('dev');
  });
});
