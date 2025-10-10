import OBSWebSocket from 'obs-websocket-js';
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { WebSocketServer } from 'ws';

export type Say = {
  t: string;
  pace: number;
  emph: number;
  pitch: number;
  beat?: string;
  overlay?: string;
  gesture?: string;
};

export type PostEvent =
  | { kind: 'pause'; beat: string; ms: number }
  | { kind: 'stinger'; beat: string; overlay?: string };

export type Perf = {
  bpm: number;
  time: string;
  quant: string;
  voice?: string;
  seq: Say[];
  post?: PostEvent[];
};

type SessionState = {
  bpm: number;
  time: string;
  quant: string;
  paceBias: number;
  theme: string;
};

const obs = new OBSWebSocket();
const app = express();
app.use(bodyParser.json());

const session: SessionState = {
  bpm: 120,
  time: '4/4',
  quant: '1/16',
  paceBias: 1.0,
  theme: 'studio',
};

const prosodyUrl = process.env.PROSODY_URL;

const wss = new WebSocketServer({ port: 5051 });
const broadcast = (msg: unknown) => {
  const payload = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
};

function beatToMs(beatTag: string, bpm: number, timeSig: [number, number] = [4, 4]) {
  const mspb = 60000 / bpm;
  const [bar, beat, div] = beatTag.replace('@', '').split(':').map(Number);
  const beatsFromStart = (bar - 1) * timeSig[0] + (beat - 1) + (div - 1) / 4;
  return Math.round(beatsFromStart * mspb);
}

function toSSML(seq: Say[], paceBias = 1.0) {
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const chunks = seq.map((w) => {
    const rate = clamp(Math.round(w.pace * paceBias * 100), 75, 125);
    const pitch = `${w.pitch >= 0 ? '+' : ''}${w.pitch}st`;
    return `<prosody rate="${rate}%" pitch="${pitch}">${w.t}</prosody>`;
  });
  return `<speak>${chunks.join(' ')}</speak>`;
}

async function connectOBS() {
  const address = process.env.OBS_URL ?? 'ws://127.0.0.1:4455';
  const password = process.env.OBS_PASSWORD ?? 'your_password';
  try {
    await obs.connect(address, password);
    console.log(`OBS connected @ ${address}`);
  } catch (err) {
    console.error('OBS connect error:', err);
  }
}

void connectOBS();

app.post('/cmd', async (req, res) => {
  const { line } = req.body as { line?: string };
  if (!line) {
    res.status(400).json({ ok: false, error: 'Missing command line' });
    return;
  }

  const [cmd, ...rest] = line.trim().split(/\s+/);
  try {
    switch (cmd) {
      case '/beat':
        session.bpm = parseInt(rest[0] ?? `${session.bpm}`, 10);
        break;
      case '/theme':
        session.theme = rest[0] ?? session.theme;
        broadcast({ type: 'patch', theme: session.theme });
        break;
      case '/pace':
        session.paceBias = parseFloat(rest[0] ?? `${session.paceBias}`);
        break;
      case '/scene':
        await obs.call('SetCurrentProgramScene', { sceneName: rest.join(' ') });
        break;
      case '/overlay':
        broadcast({ type: 'overlay', spec: rest.join(' ') });
        break;
      case '/rewrite':
        break;
      case '/quant':
        session.quant = rest[0] ?? session.quant;
        break;
      default:
        console.log('Unknown cmd:', cmd);
    }
    res.json({ ok: true, session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

async function planWithProsody(perf: Perf): Promise<{ seq: Say[]; ssml: string }> {
  if (!prosodyUrl) {
    const localSSML = toSSML(perf.seq, session.paceBias);
    return { seq: perf.seq, ssml: localSSML };
  }

  try {
    const response = await fetch(`${prosodyUrl.replace(/\/$/, '')}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        words: perf.seq.map((w) => ({ t: w.t, priority: w.emph })),
        emph_budget: 0.35,
      }),
    });

    if (!response.ok) {
      throw new Error(`Prosody sidecar error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { seq: Array<Partial<Say>>; ssml: string };
    const mergedSeq = perf.seq.map((word, idx) => ({
      ...word,
      ...data.seq[idx],
    }));
    return { seq: mergedSeq, ssml: data.ssml };
  } catch (error) {
    console.error('Prosody sidecar request failed, falling back to local SSML:', error);
    const localSSML = toSSML(perf.seq, session.paceBias);
    return { seq: perf.seq, ssml: localSSML };
  }
}

app.post('/perform', async (req, res) => {
  const perf = req.body as Perf;
  const bpm = perf.bpm ?? session.bpm;

  const plan = await planWithProsody(perf);
  const ssml = plan.ssml;

  const t0 = Date.now();

  plan.seq.forEach((word) => {
    const whenMs = word.beat ? beatToMs(word.beat, bpm) : 0;
    setTimeout(async () => {
      broadcast({ type: 'caption', word: word.t });
      if (word.gesture) {
        broadcast({ type: 'gesture', name: word.gesture });
      }
      if (word.overlay) {
        broadcast({ type: 'overlay', spec: word.overlay });
      }
      if (word.gesture === 'microZoom') {
        try {
          await obs.call('TriggerHotkeyByName', { hotkeyName: 'cam-micro-zoom' });
        } catch (error) {
          console.error('Failed to trigger micro zoom hotkey:', error);
        }
      }
    }, Math.max(0, whenMs - (Date.now() - t0)));
  });

  perf.post?.forEach((postEvent) => {
    const when = beatToMs(postEvent.beat, bpm);
    if (postEvent.kind === 'pause') {
      setTimeout(() => {
        broadcast({ type: 'pose', name: 'listening', durMs: postEvent.ms });
      }, when);
    }
    if (postEvent.kind === 'stinger') {
      setTimeout(async () => {
        broadcast({ type: 'overlay', spec: postEvent.overlay ?? 'stinger:hit' });
        try {
          await obs.call('TriggerHotkeyByName', { hotkeyName: 'stinger-hit' });
        } catch (error) {
          console.error('Failed to trigger stinger hotkey:', error);
        }
      }, when);
    }
  });

  res.json({ ok: true, ssml, usedBpm: bpm });
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5050;
app.listen(port, () => {
  console.log(`Conductor on :${port}  |  WS overlay on :5051`);
});

