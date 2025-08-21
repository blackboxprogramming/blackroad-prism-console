import React, { useEffect, useState } from "react";

const portals = [
  { name: "Roadbook",  desc: "Trip journals, maps, and itineraries." },
  { name: "Roadview",  desc: "Live journey streams on an interactive globe." },
  { name: "Lucidia",   desc: "Symbolic AI dialog and research console." },
  { name: "Roadcode",  desc: "Collaborative coding & AI co-creation." },
  { name: "Roadcoin",  desc: "Wallet, staking, and token economy." },
  { name: "Roadchain", desc: "On-chain proofs, explorer, and indexer." },
  { name: "Radius",    desc: "Local meetups and events nearby." },
];

function Status() {
  const [state, setState] = useState({ ok: null, error: null });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health.json", { cache: "no-store" });
        if (!cancelled) setState({ ok: res.ok, error: null });
      } catch (e) {
        if (!cancelled) setState({ ok: false, error: String(e) });
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/50 px-4 py-3 text-sm">
      <span className={state.ok ? "text-emerald-400" : state.ok===false ? "text-rose-400" : "text-neutral-400"}>
        {state.ok === null ? "Checking status…" : state.ok ? "✅ API healthy" : "❌ API unreachable"}
      </span>
      {state.error && <div className="mt-1 text-xs text-neutral-400">{state.error}</div>}
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 backdrop-blur-md bg-neutral-950/60 border-b border-neutral-800/60">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-semibold tracking-wide">BlackRoad.io</a>
        <div className="flex gap-4 text-sm">
          <a href="/docs" className="hover:text-emerald-300 focus-visible:outline-none focus-visible:ring ring-emerald-500/40 px-1 rounded">Docs</a>
          <a href="/status" className="hover:text-emerald-300 focus-visible:outline-none focus-visible:ring ring-emerald-500/40 px-1 rounded">Status</a>
          <a href="/portal" className="hover:text-emerald-300 focus-visible:outline-none focus-visible:ring ring-emerald-500/40 px-1 rounded">Portals</a>
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10 flex-1">
        <section aria-labelledby="hero" className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 id="hero" className="text-3xl md:text-5xl font-bold leading-tight">
              AI-native portals for the road ahead.
            </h1>
            <p className="mt-3 text-neutral-300">
              Explore journals, streams, code, and on-chain proofs—all orchestrated by Lucidia.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="/portal" className="px-4 py-2 rounded-lg bg-emerald-500 text-neutral-900 font-medium hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring ring-emerald-500/40">Browse Portals</a>
              <a href="/docs" className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neutral-500 focus-visible:outline-none focus-visible:ring ring-emerald-500/40">Read Docs</a>
            </div>
            <div className="mt-6"><Status /></div>
          </div>
          <div aria-hidden className="rounded-2xl border border-neutral-800/60 p-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
            <div className="text-sm text-neutral-300">curl https://blackroad.io/api/health.json</div>
            <div className="mt-3 text-xs text-neutral-400">
              Proxy routes: <code className="text-neutral-300">/api</code> → backend, <code className="text-neutral-300">/ws</code> for live streams.
            </div>
          </div>
        </section>

        <section aria-labelledby="portals" className="mt-12">
          <h2 id="portals" className="text-xl font-semibold">Portals</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portals.map(p => (
              <article key={p.name} className="rounded-xl border border-neutral-800/60 p-4 hover:border-neutral-600 focus-within:border-neutral-500">
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-sm mt-1 text-neutral-400">{p.desc}</p>
                <div className="mt-3">
                  <a href={`/portal/${p.name.toLowerCase()}`} className="text-emerald-300 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring ring-emerald-500/40 rounded px-1">
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
