import { describe, it, expect, afterEach } from 'vitest';
import supertest from 'supertest';
import { buildServer, bus } from '../src/index.js';
import fs from 'fs';

describe('run and approvals', () => {
  afterEach(() => {
    delete process.env.PRISM_RUN_ALLOW;
  });

  it('emits run events', async () => {
    process.env.PRISM_RUN_ALLOW = 'node';
    const app = buildServer();
    await app.listen({ port: 0 });
    const events: string[] = [];
    const handler = (e: any) => {
      if (e.kind === 'run.start') events.push('start');
      if (e.kind === 'run.out' && e.data.chunk.trim() === 'hello') events.push('out');
      if (e.kind === 'run.end') events.push('end');
    };
    bus.on('event', handler);
    await supertest(app.server)
      .post('/run')
      .send({ projectId: 'p', sessionId: 's', cmd: "node -e \"console.log('hello')\"" })
      .expect(200);
    await new Promise((r) => setTimeout(r, 500));
    await app.close();
    bus.off('event', handler);
    expect(events).toEqual(['start', 'out', 'end']);
  });

  it('handles escaped quotes in run command', async () => {
    process.env.PRISM_RUN_ALLOW = 'node';
    const app = buildServer();
    await app.listen({ port: 0 });
    const events: string[] = [];
    const handler = (e: any) => {
      if (e.kind === 'run.start') events.push('start');
      if (e.kind === 'run.out' && e.data.chunk.trim() === 'hi') events.push('out');
      if (e.kind === 'run.end') events.push('end');
    };
    bus.on('event', handler);
    await supertest(app.server)
      .post('/run')
      .send({ projectId: 'p', sessionId: 's', cmd: 'node -e "console.log(\\"hi\\")"' })
      .expect(200);
    await new Promise((r) => setTimeout(r, 500));
    await app.close();
    bus.off('event', handler);
    expect(events).toEqual(['start', 'out', 'end']);
  });

  it('emits completion when a command cannot be spawned', async () => {
    process.env.PRISM_RUN_ALLOW = 'definitely-not-real';
    const app = buildServer();
    await app.listen({ port: 0 });
    const events: any[] = [];
    const handler = (e: any) => {
      if (e.kind === 'run.err' || e.kind === 'run.end') {
        events.push(e);
      }
    };
    bus.on('event', handler);
    await supertest(app.server)
      .post('/run')
      .send({ projectId: 'p', sessionId: 's', cmd: 'definitely-not-real --flag' })
      .expect(200);
    await new Promise((r) => setTimeout(r, 500));
    bus.off('event', handler);
    await app.close();
    const endEvent = events.find((e) => e.kind === 'run.end');
    expect(endEvent).toBeDefined();
    expect(endEvent!.data.status).toBe('error');
    expect(endEvent!.data.error).toBeDefined();
  });

  it('requires approval for diffs when policy is review', async () => {
    const app = buildServer();
    await app.listen({ port: 0 });
    await supertest(app.server).put('/policy').send({ write: 'review' });
    const diff = { path: 'test.txt', hunks: [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 1, lines: ['hello'] }] };
    const res = await supertest(app.server)
      .post('/diffs/apply')
      .send({ projectId: 'p', sessionId: 's', diffs: [diff], message: 'm' })
      .expect(200);
    expect(res.body.status).toBe('pending');
    const approvalId = res.body.approvalId;
    const list = await supertest(app.server).get('/approvals?status=pending');
    expect(list.body[0].id).toBe(approvalId);
    await supertest(app.server).post(`/approvals/${approvalId}/approve`).send({});
    const content = fs.readFileSync('prism/work/test.txt', 'utf8').trim();
    expect(content).toBe('hello');
    fs.rmSync('prism/work', { recursive: true, force: true });
    await app.close();
  });
});
