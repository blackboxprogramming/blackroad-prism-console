<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/brain.ts -->
const fetch = global.fetch;
const { LUCIDIA_LLM_URL, FLAG_ALLOW_FTS_FALLBACK } = require('./config');
const { parse } = require('./english');
const { createSession, addMessage, storeMemory, exportSession } = require('./memory');
const { search } = require('./retrieval');
const { logContradiction, listContradictions, countContradictions } = require('./contradictions');
const { register, list } = require('./operators');

async function health() {
  let llm = false; let fts = true; let db = true;
  try {
    const r = await fetch(LUCIDIA_LLM_URL, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({messages:[{role:'system',content:'ping'}]}) });
    llm = r.ok;
  } catch (e) { llm = false; }
  try { search(0, 'test', 1); } catch (e) { fts = FLAG_ALLOW_FTS_FALLBACK; }
  return { status: llm && fts ? 'online' : (llm || fts ? 'degraded' : 'offline'), llm, db, fts, contradictions_open: 0, ts: Date.now() };
}

async function create(title, flags) { return createSession(title, flags); }

async function message({ session_id, content, stream = false }) {
  const parsed = parse(content, session_id, {});
  const ctx = search(session_id, content, 5);
  const body = { messages: [{ role: 'user', content }], context: ctx };
  if (stream) {
    const res = await fetch(LUCIDIA_LLM_URL + '?stream=1', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    return res.body;
  }
  const res = await fetch(LUCIDIA_LLM_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if (!res.ok) {
    logContradiction(session_id, 'Ψ′₃₂', 'warn', 'LLM unreachable');
    throw new Error('llm unavailable');
  }
  const json = await res.json();
  addMessage(session_id, 'user', content, parsed.tokens, 0);
  addMessage(session_id, 'assistant', json.reply, parsed.tokens, json.reply.length);
  return { reply: json.reply, tokens_out: json.reply.length };
}

async function memoryStore(session_id, key, value) { return storeMemory(session_id, key, value); }

function listContrads(session_id) { return listContradictions(session_id); }

function exportZip(session_id) { return exportSession(session_id); }

module.exports = { health, create, message, memoryStore, listContrads, registerOperator: register, listOperators: list, exportZip };
