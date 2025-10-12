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
import { join, dirname, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { parse as parseShell } from 'shell-quote';
import { toSSML } from './ssml.js';
import { quantizeMs, beatToMs, autofillBeats } from './timing.js';
import { metrics as computeMetrics } from './metrics.js';
import { watchMidiClock } from './midiClock.js';
import { cueAudioFX } from './audio.js';
import type { BroadcastMessage, Say, ScheduledWord, SessionState } from './types.js';

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
  payload: unknown; createdAt: string; decidedBy?: string; decidedAt?: string; requestedBy?: string;
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
const approvals: ApprovalRecord[] = [];

const session: SessionState = {
  bpm: 126,
  paceBias: 1,
  theme: 'default',
  quantDiv: '1/16',
  humanize: 8,
  timeSig: [4, 4],
  barLock: true,
};

let midiStop: (() => void) | undefined;
let lastGestureAt = 0;
let themeTimer: NodeJS.Timeout | undefined;

function broadcast(message: BroadcastMessage) {
  emit('conductor.broadcast', message);
}

function safeGesture(name: string, when: number) {
  if (when - lastGestureAt < 250) return;
  lastGestureAt = when;
  broadcast({ type: 'gesture', name });
}

function applyThemeOnBar(theme: string) {
  if (themeTimer) {
    clearTimeout(themeTimer);
    themeTimer = undefined;
  }
  const msPerBeat = 60000 / session.bpm;
  const barMs = msPerBeat * session.timeSig[0];
  const now = performance.now();
  const nextBar = Math.ceil(now / barMs) * barMs;
  const delay = Math.max(0, nextBar - now);
  themeTimer = setTimeout(() => {
    broadcast({ type: 'patch', theme });
    themeTimer = undefined;
  }, delay);
}

function applyTheme(theme: string) {
  if (session.barLock) {
    applyThemeOnBar(theme);
  } else {
    if (themeTimer) {
      clearTimeout(themeTimer);
      themeTimer = undefined;
    }
    broadcast({ type: 'patch', theme });
  }
}

function applyMoodPreset(mood?: string) {
  if (!mood) return;
  switch (mood) {
    case 'crisp':
      session.paceBias = 1.1;
      session.quantDiv = '1/16';
      session.humanize = 6;
      break;
    case 'warm':
      session.paceBias = 0.9;
      session.quantDiv = '1/8';
      session.humanize = 12;
      break;
    case 'dramatic':
      session.paceBias = 0.85;
      session.quantDiv = '1/32';
      session.humanize = 10;
      break;
    default:
      return;
  }
  emit('session.mood', {
    mood,
    state: {
      paceBias: session.paceBias,
      quantDiv: session.quantDiv,
      humanize: session.humanize,
    },
  });
}

function estimateDuration(word: Say, state: SessionState) {
  const msPerBeat = 60000 / state.bpm;
  const text = word.t.trim();
  const charCount = text.length || 1;
  const baseBeats = Math.max(0.25, charCount / 12);
  const pace = Math.max(0.2, (word.pace ?? 1) * state.paceBias);
  return (baseBeats / pace) * msPerBeat;
}

function buildSchedule(seq: Say[], state: SessionState): ScheduledWord[] {
  const schedule: ScheduledWord[] = [];
  let cursor = 0;
  for (const word of seq) {
    let baseOffset: number | undefined;
    if (typeof word.at === 'number' && word.at >= 0) {
      baseOffset = word.at;
    } else if (word.beat) {
      const beatMs = beatToMs(word.beat, state.bpm, state.timeSig);
      if (beatMs !== undefined) baseOffset = beatMs;
    }
    if (baseOffset === undefined) {
      baseOffset = cursor;
    }
    const offset = quantizeMs(baseOffset, state.bpm, state.quantDiv, state.humanize);
    const durationMs = estimateDuration(word, state);
    schedule.push({ word, offset, durationMs });
    cursor = Math.max(cursor, offset) + durationMs;
  }
  return schedule;
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

  watchMidiClock((bpm) => {
    session.bpm = Math.round(bpm);
    emit('session.bpm', { bpm: session.bpm, source: 'midi' });
  })
    .then((stop) => {
      midiStop = stop;
    })
    .catch((err) => {
      console.warn('Failed to initialise MIDI clock', err);
    });

  app.addHook('onClose', async () => {
    if (midiStop) {
      midiStop();
      midiStop = undefined;
    }
  });

  const saySchema = z.object({
    t: z.string(),
    pace: z.number().optional(),
    emph: z.number().optional(),
    pitch: z.number().optional(),
    overlay: z.string().optional(),
    beat: z.string().optional(),
    at: z.number().optional(),
  });

  const previewSchema = z.object({
    seq: z.array(saySchema),
    paceBias: z.number().optional(),
  });

  const cmdSchema = z.object({
    line: z.string(),
  });

  const performSchema = z.object({
    seq: z.array(saySchema),
    paceBias: z.number().optional(),
    startOffsetMs: z.number().optional(),
  });

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

  app.post('/preview', async (req, reply) => {
    const parsed = previewSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    const { seq, paceBias } = parsed.data;
    const ssml = toSSML(seq, paceBias ?? session.paceBias);
    reply.send({ ok: true, ssml });
  });

  app.post('/cmd', async (req, reply) => {
    const parsed = cmdSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    const { line } = parsed.data;
    const trimmed = line.trim();
    if (!trimmed.startsWith('/')) {
      reply.code(400).send({ error: 'command required' });
      return;
    }
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const rest = parts.slice(1);
    switch (command) {
      case '/beat': {
        const next = Number(rest[0]);
        if (!Number.isFinite(next) || next <= 0) {
          reply.code(400).send({ error: 'invalid bpm' });
          return;
        }
        session.bpm = Math.round(next);
        emit('session.bpm', { bpm: session.bpm, source: 'command' });
        break;
      }
      case '/pace': {
        const bias = Number(rest[0]);
        if (!Number.isFinite(bias) || bias <= 0) {
          reply.code(400).send({ error: 'invalid pace bias' });
          return;
        }
        session.paceBias = bias;
        emit('session.pace', { paceBias: session.paceBias });
        break;
      }
      case '/quant': {
        const div = rest[0] as SessionState['quantDiv'];
        if (div === '1/8' || div === '1/16' || div === '1/32') {
          session.quantDiv = div;
        } else {
          reply.code(400).send({ error: 'invalid quant division' });
          return;
        }
        emit('session.quant', { quantDiv: session.quantDiv });
        break;
      }
      case '/humanize': {
        const jitter = Number.parseInt(rest[0] ?? '0', 10);
        if (!Number.isFinite(jitter) || jitter < 0) {
          reply.code(400).send({ error: 'invalid humanize value' });
          return;
        }
        session.humanize = jitter;
        emit('session.humanize', { humanize: session.humanize });
        break;
      }
      case '/theme': {
        const theme = rest[0];
        if (!theme) {
          reply.code(400).send({ error: 'theme required' });
          return;
        }
        session.theme = theme;
        applyTheme(session.theme);
        emit('session.theme', { theme: session.theme });
        break;
      }
      case '/mood': {
        const mood = rest[0]?.toLowerCase();
        applyMoodPreset(mood);
        break;
      }
      case '/barlock': {
        const mode = rest[0]?.toLowerCase();
        session.barLock = mode !== 'off';
        if (!session.barLock && themeTimer) {
          clearTimeout(themeTimer);
          themeTimer = undefined;
        }
        emit('session.barlock', { barLock: session.barLock });
        break;
      }
      default:
        reply.code(400).send({ error: 'unknown command' });
        return;
    }
    emit('session.state', {
      bpm: session.bpm,
      paceBias: session.paceBias,
      quantDiv: session.quantDiv,
      humanize: session.humanize,
      theme: session.theme,
      barLock: session.barLock,
    });
    reply.send({ ok: true, session });
  });

  app.post('/perform', async (req, reply) => {
    const parsed = performSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: parsed.error.flatten() });
      return;
    }
    const { seq, paceBias, startOffsetMs = 0 } = parsed.data;
    const filled = autofillBeats(seq, session.bpm, session.timeSig);
    const scheduleState: SessionState = {
      ...session,
      paceBias: paceBias ?? session.paceBias,
    };
    const schedule = buildSchedule(filled, scheduleState);
    const startAt = performance.now() + Math.max(0, startOffsetMs);
    const timeline = schedule.map((entry) => ({
      word: entry.word,
      offset: entry.offset,
      at: startAt + entry.offset,
      durationMs: entry.durationMs,
    }));
    const offsets = schedule.map((entry) => entry.offset).sort((a, b) => a - b);
    const metricsResult = computeMetrics(offsets);
    if (offsets.length > 1 && metricsResult.minGap < 20) {
      console.warn('Min gap under 20ms—may feel cramped');
    }
    for (const point of timeline) {
      if (point.word.overlay === 'harm') {
        cueAudioFX(point.word, broadcast);
      } else if (point.word.overlay?.startsWith('gesture:')) {
        const [, gestureName = point.word.overlay] = point.word.overlay.split(':', 2);
        safeGesture(gestureName, point.at);
      }
    }
    emit('perform.timeline', {
      startAt,
      bpm: scheduleState.bpm,
      quantDiv: scheduleState.quantDiv,
      humanize: scheduleState.humanize,
      timeline: timeline.map((item) => ({
        t: item.word.t,
        at: item.at,
        overlay: item.word.overlay,
      })),
    });
    const ssml = toSSML(filled, scheduleState.paceBias);
    reply.send({ ok: true, startAt, metrics: metricsResult, timeline, ssml });
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
