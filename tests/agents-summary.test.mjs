import assert from 'node:assert/strict';
import { getAgentsSummary } from '../src/services/agentSummary.js';

const responses = {
  'http://localhost:3001/health': { status: 'OK', uptime: '1d' },
  'http://localhost:3001/logs?level=error&limit=1': { count: 0 },
  'http://localhost:3000/health': { status: 'OK', uptime: '2h' },
  'http://localhost:3000/logs?level=error&limit=1': { count: 0 },
  'http://localhost:4000/health': { status: 'OK', uptime: '4h' },
  'http://localhost:4000/logs?level=error&limit=1': { count: 2 },
  'http://localhost:5000/health': { status: 'FAIL', uptime: '-' },
  'http://localhost:5000/logs?level=error&limit=1': { count: 5 }
};

global.fetch = async (url) => ({ ok: true, json: async () => responses[url] });

const summary = await getAgentsSummary();
assert.deepStrictEqual(summary, {
  frontend: { status: 'OK', uptime: '1d', errors: 0, contradictions: 0 },
  api: { status: 'OK', uptime: '2h', errors: 0, contradictions: 0 },
  llm: { status: 'OK', uptime: '4h', errors: 2, contradictions: 0 },
  math: { status: 'FAIL', uptime: '-', errors: 5, contradictions: 0 }
});
