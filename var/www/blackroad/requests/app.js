'use strict';

const state = {
  q: '',
  agent: '',
  status: '',
  dataUrl: '/data/requests/index.json',
  items: [],
};

const el = (sel) => document.querySelector(sel);

function match(item, q, agent, status) {
  const hay = [
    item.title,
    item.summary,
    (item.tags || []).join(' '),
    item.agent || '',
    item.status || '',
  ]
    .join(' ')
    .toLowerCase();
  const okQ = !q || hay.includes(q.toLowerCase());
  const okA = !agent || (item.agent || '') === agent;
  const okS = !status || (item.status || '') === status;
  return okQ && okA && okS;
}

function render() {
  const q = state.q,
    agent = state.agent,
    status = state.status;
  const items = state.items.filter((it) => match(it, q, agent, status));
  el('#stats').textContent = `${items.length} / ${state.items.length} requests`;
  const list = items
    .map(
      (it) => `
    <article class="card">
      <a class="cardlink" href="/data/requests/${it.id}.json" target="_blank" rel="noopener">
        <h3>${it.title}</h3>
      </a>
      <div class="badges">
        ${it.agent ? `<span class="badge">agent: ${it.agent}</span>` : ''}
        ${it.status ? `<span class="badge">status: ${it.status}</span>` : ''}
        ${Array.isArray(it.tags) ? it.tags.map((t) => `<span class="badge">${t}</span>`).join('') : ''}
      </div>
      <p class="muted">${it.summary || ''}</p>
      <div class="kv">
        <div>Difficulty</div><div>${it.difficulty || '—'}</div>
        <div>Bounty</div><div>${it.bounty?.roadcoin ?? '—'} RC  ${it.bounty?.usd ? `(~$${it.bounty.usd})` : ''}</div>
        <div>Owner</div><div>${it.owner?.name ?? '—'}</div>
        <div>Updated</div><div>${(it.updated_at || it.created_at || '').slice(0, 19).replace('T', ' ')}</div>
      </div>
    </article>
  `
    )
    .join('');
  el('#list').innerHTML = list || `<p class="muted">No matches. Try clearing filters.</p>`;
}

async function boot() {
  try {
    const res = await fetch(state.dataUrl, { cache: 'no-store' });
    const idx = await res.json();
    state.items = Array.isArray(idx.items) ? idx.items : [];
  } catch (e) {
    console.error(e);
    state.items = [];
  }
  render();
}

['#q', '#agent', '#status'].forEach((s) => {
  el(s).addEventListener('input', (e) => {
    state[s.slice(1)] = e.target.value.trim();
    render();
  });
});

document.addEventListener('DOMContentLoaded', boot);
