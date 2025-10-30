import Fastify from 'fastify';
import { createHash, randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import {
  appendFileSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'fs';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { parse as parseShell } from 'shell-quote';

interface PrismDiffHunk { lines: string[]; }
interface PrismDiff { path: string; hunks: PrismDiffHunk[]; }
interface PrismEvent<T = any> {
  id: string;
  kind: string;
  data: T;
  index: number;
  ts: string;
  prevHash: string;
  hash: string;
}
interface RunRecord {
  id: string; projectId: string; sessionId: string; cmd: string; cwd?: string;
  status: 'running' | 'ok' | 'error' | 'cancelled'; exitCode?: number | null;
  startedAt: string; endedAt?: string;
}
interface ApprovalRecord {
  id: string; capability: string; status: 'pending'|'approved'|'denied';
  payload?: unknown; createdAt: string; decidedBy?: string; decidedAt?: string; requestedBy?: string;
}


const bus = new EventEmitter();

const GENESIS = process.env.PRISM_EVENT_GENESIS || 'PRISM-GENESIS';
const moduleDir = fileURLToPath(new URL('.', import.meta.url));
const defaultLogDir = resolve(moduleDir, '../..', 'logs');
const eventLogDir = process.env.PRISM_EVENT_LOG_DIR
  ? resolve(process.env.PRISM_EVENT_LOG_DIR)
  : defaultLogDir;
const eventLogPath = join(eventLogDir, 'events.jsonl');

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const result: Record<string, unknown> = {};
  for (const [key, val] of entries) {
    result[key] = canonicalize(val);
  }
  return result;
}

const canonicalJson = (value: unknown) => JSON.stringify(canonicalize(value));

const hashMaterial = (material: string) => createHash('sha256').update(material).digest('hex');

mkdirSync(eventLogDir, { recursive: true });

let lastIndex = -1;
let lastHash = GENESIS;

if (existsSync(eventLogPath)) {
  try {
    const content = readFileSync(eventLogPath, 'utf8').trim();
    const lastLine = content ? content.split('\n').filter(Boolean).pop() : undefined;
    if (lastLine) {
      const parsed = JSON.parse(lastLine) as Partial<PrismEvent>;
      if (typeof parsed.index === 'number' && typeof parsed.hash === 'string') {
        lastIndex = parsed.index;
        lastHash = parsed.hash;
      }
    }
  } catch (err) {
    console.error('Failed to read existing event log', err);
  }
}

const policy = { write: 'auto' as 'auto' | 'review' };
const runs: RunRecord[] = [];
const activeRuns = new Map<string, ChildProcessWithoutNullStreams>();
const approvals: ApprovalRecord[] = [];

const MAX_RUN_HISTORY = 100;
const MAX_APPROVAL_HISTORY = 100;

function pruneRuns() {
  if (runs.length <= MAX_RUN_HISTORY) return;
  let removeCount = runs.length - MAX_RUN_HISTORY;
  for (let i = 0; i < runs.length && removeCount > 0;) {
    if (runs[i].status !== 'running') {
      runs.splice(i, 1);
      removeCount--;
    } else {
      i++;
    }
  }
}

function pruneApprovals() {
  if (approvals.length <= MAX_APPROVAL_HISTORY) return;
  let removeCount = approvals.length - MAX_APPROVAL_HISTORY;
  for (let i = 0; i < approvals.length && removeCount > 0;) {
    if (approvals[i].status !== 'pending') {
      approvals.splice(i, 1);
      removeCount--;
    } else {
      i++;
    }
  }
}

function finalizeRun(
  rec: RunRecord,
  status: RunRecord['status'],
  exitCode: number | null,
  extra?: Record<string, unknown>,
) {
  if (rec.endedAt) return;
  const endedAt = new Date().toISOString();
  rec.status = status;
  rec.exitCode = exitCode;
  rec.endedAt = endedAt;
  activeRuns.delete(rec.id);
  pruneRuns();
  emit('run.end', {
    runId: rec.id,
    exitCode,
    status,
    durationMs: Date.parse(endedAt) - Date.parse(rec.startedAt),
    ...(extra ?? {}),
  });
}

function emit<T>(kind: string, data: T) {
  const id = randomUUID();
  const ts = new Date().toISOString();
  const index = lastIndex + 1;
  const prevHash = lastHash;
  const material = `${prevHash}|${canonicalJson({ id, kind, data })}|${ts}|${index}`;
  const hash = hashMaterial(material);
  const event: PrismEvent<T> = { id, kind, data, index, ts, prevHash, hash };
  try {
    appendFileSync(eventLogPath, `${JSON.stringify(event)}\n`);
  } catch (err) {
    console.error('Failed to append event log', err);
  }
  lastIndex = index;
  lastHash = hash;
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
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
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
    const parts = parseShell(cmd);
    if (parts.some((p) => typeof p !== 'string')) throw new Error('invalid cmd');
    return parts as string[];
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
    activeRuns.set(id, child);
    emit('run.start', { runId: id, cmd, cwd });
    child.stdout.on('data', (c) => emit('run.out', { runId: id, chunk: c.toString() }));
    child.stderr.on('data', (c) => emit('run.err', { runId: id, chunk: c.toString() }));
    child.on('close', (code) => {
      const status = rec.status === 'cancelled' ? 'cancelled' : code === 0 ? 'ok' : 'error';
      finalizeRun(rec, status, code ?? null);
    });
    child.on('error', (err) => {
      emit('run.err', { runId: id, chunk: err.message });
      finalizeRun(rec, 'error', null, { error: err.message });
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
    const child = rec ? activeRuns.get(rec.id) : undefined;
    if (rec && child) {
      rec.status = 'cancelled';
      child.kill('SIGTERM');
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
      pruneApprovals();
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
    delete a.payload;
    pruneApprovals();
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
    delete a.payload;
    pruneApprovals();
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
import intelRoutes from './routes/intel';
import policyRoutes from './policy';
import diffRoutes from './routes/diffs';
import runRoutes from './routes/run';
import graphRoutes from './routes/graph';

export function buildServer() {
  const app = Fastify();
  app.register(intelRoutes);
  app.register(policyRoutes);
  app.register(diffRoutes);
  app.register(runRoutes);
  app.register(graphRoutes);
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  app.listen({ port: 3000 }, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log('Server running on 3000');
  });
}
