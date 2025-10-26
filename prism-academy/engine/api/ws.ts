import { WebSocketServer, WebSocket, RawData } from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import { EventStore, normalizeEvent, PrismEvent, assertEvent } from '../runtime/events';
import { PresenceSnapshot, PresenceTracker } from '../runtime/presence';
import { LiveScoreEngine, ScoreSummary } from '../runtime/scoring.live';
import { BadgeAward, BadgeEngine } from '../runtime/badges';
import { LabSessionDefinition } from '../types';

const PORT = Number(process.env.PRISM_LIVE_PORT ?? 5252);
const RATE_LIMIT_MS = 2000;

const eventStore = new EventStore();
const presence = new PresenceTracker();
const scoreEngine = new LiveScoreEngine({ presence });
const badgeEngine = new BadgeEngine();

const sessionCache = new Map<string, LabSessionDefinition>();

async function loadSessions() {
  const dir = path.resolve('prism-academy', 'labs', 'sessions');
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      const data = JSON.parse(raw) as LabSessionDefinition;
      sessionCache.set(data.id, data);
      badgeEngine.upsertSessionDefinition(data);
    }
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to load lab sessions', error);
    }
  }
}

loadSessions().catch((error) => console.error('Session preload failed', error));

const wss = new WebSocketServer({ port: PORT });
const clients = new Set<WebSocket>();
const lastSpeech = new Map<string, number>();

interface BroadcastEnvelope {
  type: 'event' | 'warning' | 'error';
  event?: PrismEvent;
  presence?: PresenceSnapshot;
  scores?: ScoreSummary;
  awards?: BadgeAward[];
  warning?: string;
  error?: string;
}

function broadcast(payload: BroadcastEnvelope) {
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

async function appendAndEmit(event: PrismEvent) {
  await eventStore.append(event);
  const scores = scoreEngine.score(event);
  const presenceSnapshot = presence.snapshot(event.session_id);
  const awards = badgeEngine.record(event);
  broadcast({ type: 'event', event, scores, presence: presenceSnapshot, awards });
}

function shouldRateLimit(event: PrismEvent) {
  if (event.type !== 'say') {
    return false;
  }
  const now = Date.now();
  const last = lastSpeech.get(event.agent_id) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    return true;
  }
  lastSpeech.set(event.agent_id, now);
  return false;
}

async function checkAutoDeescalate(event: PrismEvent) {
  const payload = event.payload as Record<string, unknown>;
  const spike = typeof payload.emotion_spike === 'number' ? payload.emotion_spike : undefined;
  if (spike && spike >= 2) {
    const session = sessionCache.get(event.session_id);
    const teacher = session?.roles.find((role) => role.name === 'teacher');
    const teacherId = teacher?.id ?? 'teacher-auto';
    const macro: PrismEvent = {
      ts: new Date().toISOString(),
      session_id: event.session_id,
      agent_id: teacherId,
      type: 'mod',
      payload: {
        action: 'de-escalate',
        message: '🌧️ seen → 🪞 → pause 10s → 🌬️🪞',
        system: true,
      },
    };
    await appendAndEmit(macro);
  }
}

async function handleIncoming(raw: RawData, ws: WebSocket) {
  let event: PrismEvent;
  try {
    event = normalizeEvent(assertEvent(JSON.parse(raw.toString())));
  } catch (error: any) {
    ws.send(
      JSON.stringify({
        type: 'error',
        error: error?.message ?? 'Invalid event',
      }),
    );
    return;
  }

  if (shouldRateLimit(event)) {
    ws.send(
      JSON.stringify({
        type: 'warning',
        warning: 'Rate limit: 1 message every 2s',
      }),
    );
    return;
  }

  await appendAndEmit(event);
  await checkAutoDeescalate(event);
}

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('message', (raw) => {
    handleIncoming(raw, ws).catch((error) => {
      ws.send(
        JSON.stringify({
          type: 'error',
          error: error?.message ?? 'Processing failure',
        }),
      );
    });
  });
  ws.on('close', () => {
    clients.delete(ws);
  });
});

console.log(`Prism Live WS listening on ws://localhost:${PORT}`);
