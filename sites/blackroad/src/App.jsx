import React, { useEffect, useState } from 'react';

const portals = [
  { name: 'Roadbook', desc: 'Trip journals, maps, and itineraries.' },
  { name: 'Roadview', desc: 'Live journey streams on an interactive globe.' },
  { name: 'Lucidia', desc: 'Symbolic AI dialog and research console.' },
  { name: 'Roadcode', desc: 'Collaborative coding & AI co-creation.' },
  { name: 'Roadcoin', desc: 'Wallet, staking, and token economy.' },
  { name: 'Roadchain', desc: 'On-chain proofs, explorer, and indexer.' },
  { name: 'Radius', desc: 'Local meetups and events nearby.' },
];

function Status() {
  const [state, setState] = useState({ ok: null, error: null, info: '' });

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch('/api/health.json', { cache: 'no-store' });
        const text = await res.text();
        let info = '';
        try {
          const json = JSON.parse(text);
          info = `${json.service || ''} • ${json.time || ''}`;
        } catch {}
        if (!canceled) setState({ ok: res.ok, error: null, info });
      } catch (e) {
        if (!canceled) setState({ ok: false, error: String(e), info: '' });
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  let label = 'Checking status…';
  let tone = 'text-neutral-400';
  if (state.ok === true) {
    label = '✅ API healthy';
    tone = 'text-emerald-400';
  }
  if (state.ok === false) {
    label = '❌ API unreachable';
    tone = 'text-rose-400';
  }

  return (
    <p className={`mt-3 text-sm ${tone}`}>
      {label}
      {state.info && <span className="ml-2 text-neutral-400">{state.info}</span>}
      {state.error && <span className="ml-2">{state.error}</span>}
    </p>
  );
}

function Nav() {
  return (
    <nav className="border-b border-neutral-800/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-14 flex items-center gap-4 text-sm">
          <a href="/" className="font-semibold text-neutral-100">
            BlackRoad.io
          </a>
          <div className="flex-grow" />
          <a href="/docs" className="nav-link">
            Docs
          </a>
          <a href="/status.html" className="nav-link">
            Status
          </a>
          <a href="#portals" className="nav-link">
            Portals
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-grow mx-auto max-w-6xl px-4 py-12">
        <section>
          <h1 className="text-3xl sm:text-4xl font-bold">
            AI-native portals for the road ahead.
          </h1>
          <p className="mt-4 text-lg text-neutral-300">
            Explore journals, streams, code, and on-chain proofs — orchestrated by
            Lucidia.
          </p>
          <div className="mt-8 flex gap-4">
            <a href="#portals" className="btn-primary">
              Browse Portals
            </a>
            <a href="/docs" className="btn-secondary">
              Read Docs
            </a>
          </div>
          <Status />
          <div
            aria-hidden
            className="rounded-2xl border border-neutral-800/60 p-6 bg-gradient-to-b from-neutral-900 to-neutral-950 mt-6"
          >
            <div className="text-sm text-neutral-300 select-all">
              curl https://blackroad.io/api/health.json
            </div>
            <div className="mt-3 text-xs text-neutral-400">
              Proxy: <code className="text-neutral-300">/api</code> → backend ·{' '}
              <code className="text-neutral-300">/ws</code> for live streams.
            </div>
          </div>
        </section>

        <section aria-labelledby="portals" className="mt-12">
          <h2 id="portals" className="text-xl font-semibold">
            Portals
          </h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portals.map((p) => (
              <article key={p.name} className="card">
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-sm mt-1 text-neutral-400">{p.desc}</p>
                <div className="mt-3">
                  <a
                    aria-label={`Open ${p.name}`}
                    href={`/portal/${p.name.toLowerCase()}`}
                    className="link-cta"
                  >
                    Open →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800/60">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-400">
          © {new Date().getFullYear()} BlackRoad. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

