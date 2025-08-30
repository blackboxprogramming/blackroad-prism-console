'use strict';

const SERVICES = {
  frontend: process.env.FRONTEND_URL || 'http://localhost:3001',
  api: process.env.API_URL || 'http://localhost:3000',
  llm: process.env.LLM_URL || 'http://localhost:4000',
  math: process.env.MATH_URL || 'http://localhost:5000',
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch_failed');
  return res.json();
}

async function getService(id, base) {
  try {
    const health = await fetchJson(`${base}/health`);
    const logs = await fetchJson(`${base}/logs?level=error&limit=1`).catch(() => ({
      count: 0,
      logs: [],
    }));
    return {
      status: health.status || health.ok || 'FAIL',
      uptime: health.uptime || '-',
      errors: logs.count || (Array.isArray(logs.logs) ? logs.logs.length : 0),
      contradictions: health.contradictions || 0,
    };
  } catch {
    return { status: 'FAIL', uptime: '-', errors: 0, contradictions: 0 };
  }
}

// Fetch all services concurrently for faster summaries.
async function getAgentsSummary() {
  const entries = await Promise.all(
    Object.entries(SERVICES).map(async ([id, base]) => [id, await getService(id, base)])
  );
  return Object.fromEntries(entries);
}

module.exports = { getAgentsSummary };
