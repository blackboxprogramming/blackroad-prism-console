import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';
import request from 'supertest';

describe('graph ingest', () => {
  const app = buildServer();
  beforeAll(async () => { await app.ready(); });
  afterAll(async () => { await app.close(); });
  it('creates nodes and edges', async () => {
    await request(app.server).post('/graph/event').send({ projectId: 'p', event: { type: 'run.start', runId: 'r1', cmd: 'echo', cwd: '/' } });
    await request(app.server).post('/graph/event').send({ projectId: 'p', event: { type: 'file.write', path: 'src/a.ts', runId: 'r1' } });
    await request(app.server).post('/graph/event').send({ projectId: 'p', event: { type: 'run.end', runId: 'r1', status: 'ok', exitCode: 0 } });
    const res = await request(app.server).get('/graph').query({ projectId: 'p' });
    const ids = res.body.nodes.map((n: any) => n.id);
    expect(ids).toContain('file:src/a.ts');
    expect(ids).toContain('process:r1');
    const edges = res.body.edges.map((e: any) => e.id);
    expect(edges).toContain('link:process:r1->file:src/a.ts');
  });
});
