import { Router } from 'express';
import fs from 'fs';
import { dirname, join, resolve } from 'path';

type DeviceRecord = Record<string, any> & { deviceId?: string; lastSeen?: number };

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const router = Router();

const resolveBase = () => resolve(process.env.API_DATA_ROOT || '.');
const resolveAgentsRoot = () => resolve(process.env.API_AGENTS_ROOT || 'agents');

const devicesFile = () => join(resolveBase(), 'data', 'admin', 'devices.json');
const broadcastLogFile = () => join(resolveBase(), 'data', 'admin', 'device_broadcasts.jsonl');
const iamDevicesFile = () => join(resolveBase(), 'iam', 'devices.json');
const connectorsSourcesFile = () => join(resolveBase(), 'elt', 'sources.json');
const connectorsSinksFile = () => join(resolveBase(), 'elt', 'sinks.json');

function ensureDir(path: string) {
  fs.mkdirSync(dirname(path), { recursive: true });
}

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!fs.existsSync(path)) return fallback;
    return JSON.parse(fs.readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, value: unknown) {
  ensureDir(path);
  fs.writeFileSync(path, JSON.stringify(value, null, 2));
}

const readDevices = (): DeviceRecord[] => readJson(devicesFile(), [] as DeviceRecord[]);
const writeDevices = (arr: DeviceRecord[]) => writeJson(devicesFile(), arr);

const recordBroadcast = (entry: { ts: number; message: string; devices: string[] }) => {
  const file = broadcastLogFile();
  ensureDir(file);
  fs.appendFileSync(file, `${JSON.stringify(entry)}\n`);
};

const readLastBroadcast = () => {
  const file = broadcastLogFile();
  if (!fs.existsSync(file)) return null as null | { ts: number; message: string; devices: string[] };
  const content = fs.readFileSync(file, 'utf-8').trim();
  if (!content) return null;
  const lastLine = content.split('\n').filter(Boolean).pop();
  if (!lastLine) return null;
  try {
    return JSON.parse(lastLine) as { ts: number; message: string; devices: string[] };
  } catch {
    return null;
  }
};

function countAgents(): number {
  const root = resolveAgentsRoot();
  if (!fs.existsSync(root)) return 0;
  try {
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter((dir) => dir.isDirectory())
      .filter((dir) => fs.existsSync(join(root, dir.name, 'manifest.json')))
      .length;
  } catch {
    return 0;
  }
}

function collectPingSummary() {
  const now = Date.now();
  const devices = readDevices();
  const onlineDevices = devices.filter((device) =>
    typeof device.lastSeen === 'number' && now - device.lastSeen <= ONLINE_WINDOW_MS,
  ).length;

  const iam = readJson<{ devices?: Record<string, any> }>(iamDevicesFile(), { devices: {} });
  const iamValues = Object.values(iam.devices || {});
  const compliantIam = iamValues.filter((entry: any) => entry?.posture?.compliant === true).length;

  const sources = readJson<{ sources?: Record<string, any> }>(connectorsSourcesFile(), { sources: {} }).sources || {};
  const sinks = readJson<{ sinks?: Record<string, any> }>(connectorsSinksFile(), { sinks: {} }).sinks || {};

  return {
    devices: {
      total: devices.length,
      online: onlineDevices,
    },
    iam: {
      total: iamValues.length,
      compliant: compliantIam,
    },
    connectors: {
      sources: Object.keys(sources).length,
      sinks: Object.keys(sinks).length,
    },
    agents: {
      total: countAgents(),
    },
    lastBroadcast: readLastBroadcast(),
  };
}

router.post('/devices/register', (req, res) => {
  const { deviceId, owner, platform } = req.body || {};
  if (!deviceId || !owner || !platform) return res.status(400).json({ error: 'bad_request' });
  const arr = readDevices().filter((d) => d.deviceId !== deviceId);
  arr.push({ deviceId, owner, platform, encrypted: false, compliant: false, lastSeen: Date.now() });
  writeDevices(arr);
  res.json({ ok: true });
});

router.post('/devices/update', (req, res) => {
  const { deviceId, key, value } = req.body || {};
  const arr = readDevices().map((d) =>
    d.deviceId === deviceId ? { ...d, [key]: value, lastSeen: Date.now() } : d,
  );
  writeDevices(arr);
  res.json({ ok: true });
});

router.post('/devices/broadcast', (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ error: 'message_required' });
  }
  const devices = readDevices();
  const ts = Date.now();
  const targets = devices.map((d) => d.deviceId).filter((id): id is string => Boolean(id));

  const updated = devices.map((device) => ({ ...device, lastPostAt: ts, lastPostMessage: message }));
  writeDevices(updated);

  recordBroadcast({ ts, message, devices: targets });

  const summary = collectPingSummary();
  res.json({ ok: true, delivered: targets.length, summary });
});

router.get('/devices/ping', (_req, res) => {
  res.json({ ok: true, summary: collectPingSummary() });
});

router.get('/devices/list', (_req, res) => res.json({ items: readDevices() }));

export default router;
