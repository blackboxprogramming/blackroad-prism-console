'use strict';

const { spawn } = require('child_process');
const metricsService = require('./metricsService');
const db = require('../db');

const DEFAULT_HOST = 'jetson.local';
const DEFAULT_USER = 'jetson';
const DEFAULT_PORT = 22;
const DEFAULT_TIMEOUT_MS = parseInt(process.env.JETSON_SSH_TIMEOUT_MS || '8000', 10);
const SSH_BIN = process.env.JETSON_SSH_BIN || 'ssh';
const METRICS_CMD =
  process.env.JETSON_STATS_COMMAND ||
  'nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits';
const CONFIGURED_MAX_NETWORK_BYTES = Number(process.env.DASHBOARD_MAX_NETWORK_BYTES || NaN);
const ASSUMED_MAX_NETWORK_BYTES =
  Number.isFinite(CONFIGURED_MAX_NETWORK_BYTES) && CONFIGURED_MAX_NETWORK_BYTES > 0
    ? CONFIGURED_MAX_NETWORK_BYTES
    : 125_000_000; // Approx. 1 Gbps expressed in bytes/sec

function parseJetsonConfig() {
  const config = {
    host: DEFAULT_HOST,
    user: DEFAULT_USER,
    port: Number.parseInt(process.env.JETSON_PORT || DEFAULT_PORT, 10) || DEFAULT_PORT
  };

  const hostEnv = (process.env.JETSON_HOST || '').trim();
  if (hostEnv) {
    if (hostEnv.includes('@')) {
      const [maybeUser, maybeHost] = hostEnv.split('@');
      if (maybeUser) config.user = maybeUser.trim();
      if (maybeHost) config.host = maybeHost.trim();
    } else {
      config.host = hostEnv;
    }
  }

  const userEnv = (process.env.JETSON_USER || '').trim();
  if (userEnv) config.user = userEnv;

  return config;
}

function runSshCommand(config, command) {
  return new Promise((resolve, reject) => {
    const timeoutMs = DEFAULT_TIMEOUT_MS > 0 ? DEFAULT_TIMEOUT_MS : 8000;
    const connectTimeout = Math.max(1, Math.floor(timeoutMs / 1000));
    const args = [
      '-o',
      'BatchMode=yes',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      '-o',
      `ConnectTimeout=${connectTimeout}`,
      '-p',
      String(config.port)
    ];

    if (process.env.JETSON_SSH_ARGS) {
      args.push(
        ...process.env.JETSON_SSH_ARGS.split(/\s+/).filter(Boolean)
      );
    }

    args.push(`${config.user}@${config.host}`, command);

    const child = spawn(SSH_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      reject(err);
    });

    const killTimer = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(killTimer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(stderr.trim() || `ssh exited with code ${code}`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });
  });
}

async function fetchJetsonStats() {
  const config = parseJetsonConfig();
  try {
    const { stdout, stderr } = await runSshCommand(config, METRICS_CMD);
    const lines = stdout.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let gpuUtil = null;
    let memoryUsedMb = null;
    let memoryTotalMb = null;
    if (lines.length) {
      const values = lines[0]
        .split(',')
        .map((part) => Number.parseFloat(part.trim()))
        .filter((num) => Number.isFinite(num));
      if (values.length === 3) {
        [gpuUtil, memoryUsedMb, memoryTotalMb] = values;
      } else if (values.length === 2) {
        [gpuUtil, memoryUsedMb] = values;
      } else if (values.length === 1) {
        [gpuUtil] = values;
      }
    }
    return {
      reachable: true,
      host: config.host,
      user: config.user,
      port: config.port,
      gpuUtil,
      memoryUsedMb,
      memoryTotalMb,
      raw: stdout.trim(),
      stderr: stderr.trim() || null
    };
  } catch (err) {
    const message =
      (err && typeof err.stderr === 'string' && err.stderr.trim()) ||
      (err && typeof err.message === 'string' && err.message) ||
      'jetson_unreachable';
    const raw = err && typeof err.stdout === 'string' ? err.stdout.trim() : '';
    return {
      reachable: false,
      host: config.host,
      user: config.user,
      port: config.port,
      error: message,
      raw
    };
  }
}

function computeNetworkPercent(networkStats) {
  if (!Array.isArray(networkStats) || networkStats.length === 0) return 0;
  const totals = networkStats.reduce(
    (acc, iface) => {
      if (iface && (!iface.operstate || iface.operstate === 'up')) {
        const rx = Number(iface.rx_sec) || 0;
        const tx = Number(iface.tx_sec) || 0;
        acc.rx += rx;
        acc.tx += tx;
      }
      return acc;
    },
    { rx: 0, tx: 0 }
  );
  const bytesPerSecond = totals.rx + totals.tx;
  if (!bytesPerSecond || !Number.isFinite(bytesPerSecond)) return 0;
  const maxBytes = ASSUMED_MAX_NETWORK_BYTES > 0 ? ASSUMED_MAX_NETWORK_BYTES : 125_000_000;
  return Math.min(100, (bytesPerSecond / maxBytes) * 100);
}

async function getSystemSnapshot() {
  const [localMetrics, jetsonResult] = await Promise.all([
    metricsService
      .sample()
      .catch(() => null),
    fetchJetsonStats()
  ]);

  const jetson = jetsonResult || { reachable: false };

  const cpuLoad =
    localMetrics && localMetrics.cpu && Number.isFinite(localMetrics.cpu.currentLoad)
      ? localMetrics.cpu.currentLoad
      : localMetrics && localMetrics.cpu && Number.isFinite(localMetrics.cpu.currentload)
        ? localMetrics.cpu.currentload
        : 0;

  const memoryPct =
    localMetrics && localMetrics.mem && localMetrics.mem.total
      ? (localMetrics.mem.used / localMetrics.mem.total) * 100
      : 0;

  const networkPct = computeNetworkPercent(localMetrics ? localMetrics.network : null);
  const gpuPct = Number.isFinite(jetson.gpuUtil) ? jetson.gpuUtil : 0;

  return {
    cpu: Math.max(0, Math.round(cpuLoad)),
    memory: Math.max(0, Math.round(memoryPct)),
    gpu: Math.max(0, Math.round(gpuPct)),
    network: Math.max(0, Math.round(networkPct)),
    local: localMetrics,
    jetson
  };
}

function safeParse(json) {
  try {
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

function summariseEvent(row) {
  const payload = safeParse(row.data);
  const text =
    (payload && (payload.text || payload.message || payload.summary || payload.description)) ||
    row.type ||
    'event';
  return {
    id: row.id,
    type: row.type,
    text,
    createdAt: row.created_at
  };
}

function getFeed(limit = 25) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);
  const rows = db
    .prepare(
      'SELECT id, type, data, created_at FROM timeline_events ORDER BY created_at DESC LIMIT ?'
    )
    .all(safeLimit);
  return rows.map(summariseEvent);
}

module.exports = {
  getSystemSnapshot,
  getFeed,
  parseJetsonConfig,
  fetchJetsonStats
};
