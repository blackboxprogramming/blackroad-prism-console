import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve, sep } from 'path';
import { z } from 'zod';

interface PrismDiffHunk { lines: string[]; }
interface PrismDiff { path: string; hunks: PrismDiffHunk[]; }
interface PrismEvent<T = any> { id: string; kind: string; data: T; }
interface RunRecord {
  id: string; projectId: string; sessionId: string; cmd: string; cwd?: string;
  status: 'running' | 'ok' | 'error' | 'cancelled'; exitCode?: number | null;
  startedAt: string; endedAt?: string;
}
interface ApprovalRecord {
  id: string; capability: string; status: 'pending'|'approved'|'denied';
  payload: unknown; createdAt: string; decidedBy?: string; decidedAt?: string; requestedBy?: string;
}


const bus = new EventEmitter();

const policy = { write: 'auto' as 'auto' | 'review' };
const runs: RunRecord[] = [];
const approvals: ApprovalRecord[] = [];

function emit<T>(kind: string, data: T) {
  const event: PrismEvent<T> = { id: randomUUID(), kind, data };
  bus.emit('event', event);
}

export function buildServer() {
  const app = Fastify();

  app.get('/events', (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const listener = (event: PrismEvent<any>) => {
      reply.raw.write(`id: ${event.id}\n`);
      reply.raw.write(`event: ${event.kind}\n`);
      reply.raw.write(`data: ${JSON.stringify(event.data)}\n\n`);
    };
    bus.on('event', listener);
    req.raw.on('close', () => bus.off('event', listener));
  });

  const runSchema = z.object({
    projectId: z.string(),
    sessionId: z.string(),
    cmd: z.string(),
    cwd: z.string().optional(),
    env: z.record(z.string()).optional(),
  });

  function parseCmd(cmd: string): string[] {
    const args: string[] = [];
    let cur = '';
    let quote: string | null = null;
    for (let i = 0; i < cmd.length; i++) {
      const c = cmd[i];
      if (quote) {
        if (c === quote) {
          quote = null;
        } else {
          cur += c;
        }
      } else {
        if (c === '"' || c === "'") {
          quote = c;
        } else if (/\s/.test(c)) {
          if (cur) {
            args.push(cur);
            cur = '';
          }
        } else {
          cur += c;
        }
      }
    }
    if (quote) throw new Error('unclosed quote');
    if (cur) args.push(cur);
    return args;
  }

  app.post('/run', async (req, reply) => {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    const { projectId, sessionId, cmd, cwd, env } = parsed.data;
    let parts: string[];
    try {
      parts = parseCmd(cmd);
    } catch {
      reply.code(400).send({ error: 'invalid cmd' });
      return;
    }
    if (!parts.length) {
      reply.code(400).send({ error: 'cmd required' });
      return;
    }
    const allow = (process.env.PRISM_RUN_ALLOW || '').split(',').filter(Boolean);
    const command = parts[0];
    if (allow.length && !allow.includes(command)) {
      reply.code(400).send({ error: 'cmd not allowed' });
      return;
    }
    const dangerous = ['&&', ';', '|', '||', '>', '<'];
    if (parts.some((p) => dangerous.includes(p))) {
      reply.code(400).send({ error: 'cmd not allowed' });
      return;
    }
    const id = randomUUID();
    const startedAt = new Date().toISOString();
    const rec: RunRecord = {
      id,
      projectId,
      sessionId,
      cmd,
      cwd,
      status: 'running',
      startedAt,
    };
    runs.push(rec);
    const child = spawn(command, parts.slice(1), { cwd, env });
    (rec as any).child = child;
    emit('run.start', { runId: id, cmd, cwd });
    child.stdout.on('data', (c) => emit('run.out', { runId: id, chunk: c.toString() }));
    child.stderr.on('data', (c) => emit('run.err', { runId: id, chunk: c.toString() }));
    child.on('close', (code) => {
      rec.status = code === 0 ? 'ok' : 'error';
      rec.exitCode = code ?? null;
      rec.endedAt = new Date().toISOString();
      emit('run.end', {
        runId: id,
        exitCode: code,
        durationMs: Date.parse(rec.endedAt) - Date.parse(startedAt),
      });
    });
    reply.send({ runId: id });
  });

  app.get('/runs', async (req, reply) => {
    const { projectId, limit = '50' } = req.query as any;
    const list = runs.filter((r) => r.projectId === projectId).slice(-Number(limit));
    reply.send(list);
  });

  app.post('/run/:id/cancel', async (req, reply) => {
    const rec = runs.find((r) => r.id === (req.params as any).id);
    if (rec && (rec as any).child) {
      (rec as any).child.kill('SIGTERM');
      rec.status = 'cancelled';
      rec.endedAt = new Date().toISOString();
      emit('run.end', { runId: rec.id, exitCode: null, durationMs: 0 });
    }
    reply.send({ ok: true });
  });

  const diffApplySchema = z.object({
    projectId: z.string(),
    sessionId: z.string(),
    diffs: z.array(z.object({ path: z.string(), hunks: z.any() })),
    message: z.string(),
  });

  function writeDiffs(diffs: PrismDiff[]) {
    const base = join(process.cwd(), 'prism', 'work');
    for (const d of diffs) {
      const filePath = resolve(base, d.path);
      if (!filePath.startsWith(base + sep)) {
        throw new Error('invalid path');
      }
      mkdirSync(dirname(filePath), { recursive: true });
      const content = d.hunks.map((h: PrismDiffHunk) => h.lines.join('\n')).join('\n');
      writeFileSync(filePath, content);
      emit('file.write', { path: d.path });
    }
  }

  app.post('/diffs/apply', async (req, reply) => {
    const parsed = diffApplySchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    const { diffs } = parsed.data;
    if (policy.write === 'review') {
      const approvalId = randomUUID();
      const approval: ApprovalRecord = {
        id: approvalId,
        capability: 'write',
        status: 'pending',
        payload: diffs,
        createdAt: new Date().toISOString(),
        requestedBy: 'lucidia' as any,
      };
      approvals.push(approval);
      emit('plan', { summary: 'Write requires approval', ctx: { approvalId } });
      reply.send({ status: 'pending', approvalId });
    } else {
      try {
        writeDiffs(diffs as any);
        reply.send({ status: 'applied' });
      } catch (e: any) {
        reply.code(400).send({ error: e.message });
      }
    }
  });

  app.get('/approvals', async (req, reply) => {
    const status = (req.query as any).status;
    const list = status ? approvals.filter((a) => a.status === status) : approvals;
    reply.send(list.map((a) => ({ id: a.id, capability: a.capability, createdAt: a.createdAt, status: a.status })));
  });

  app.get('/approvals/:id', async (req, reply) => {
    const id = (req.params as any).id;
    const a = approvals.find((x) => x.id === id);
    if (!a) {
      reply.code(404).send({ error: 'not found' });
      return;
    }
    reply.send(a);
  });

  app.post('/approvals/:id/approve', async (req, reply) => {
    const id = (req.params as any).id;
    const a = approvals.find((x) => x.id === id);
    if (!a) {
      reply.code(404).send({ error: 'not found' });
      return;
    }
    a.status = 'approved';
    a.decidedBy = 'user';
    a.decidedAt = new Date().toISOString();
    if (a.capability === 'write') {
      try {
        writeDiffs(a.payload as any);
      } catch (e: any) {
        reply.code(400).send({ error: e.message });
        return;
      }
    }
    emit('approval.approved', { id });
    reply.send({ status: 'approved' });
  });

  app.post('/approvals/:id/deny', async (req, reply) => {
    const id = (req.params as any).id;
    const a = approvals.find((x) => x.id === id);
    if (!a) {
      reply.code(404).send({ error: 'not found' });
      return;
    }
    a.status = 'denied';
    a.decidedBy = 'user';
    a.decidedAt = new Date().toISOString();
    emit('approval.denied', { id });
    reply.send({ status: 'denied' });
  });

  app.get('/policy', async (_req, reply) => {
    reply.send(policy);
  });

  app.put('/policy', async (req, reply) => {
    const body = req.body as any;
    if (body.write === 'review' || body.write === 'auto') {
      policy.write = body.write;
    }
    reply.send(policy);
  });

  return app;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildServer();
  app.listen({ port: 3000 });
}
export { bus };
