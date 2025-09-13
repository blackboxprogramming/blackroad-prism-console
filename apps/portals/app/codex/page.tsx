"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CodexSearch from "../../components/CodexSearch";
import CodexTag from "../../components/CodexTag";

interface Item {
  id: string;
  slug: string;
  title: string;
  tags?: string[];
  updated?: string;
}

export default function CodexIndex() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    fetch("/codex-index.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    items.forEach((i) => (i.tags || []).forEach(t.add, t));
    return Array.from(t).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return items
      .filter((i) => {
        const okQ =
          !qn ||
          i.title.toLowerCase().includes(qn) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(qn));
        const okT = !tag || (i.tags || []).includes(tag);
        return okQ && okT;
      })
      .sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
  }, [items, q, tag]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Codex Prompts</h1>
        <CodexSearch value={q} onChange={setQ} />
      </header>

      <section className="mb-5 flex flex-wrap gap-2">
        <CodexTag label="all" active={!tag} onClick={() => setTag(null)} />
        {allTags.map((t) => (
          <CodexTag key={t} label={t} active={tag === t} onClick={() => setTag(t)} />
        ))}
      </section>

      <ul className="grid gap-3">
        {filtered.map((i) => (
          <li key={i.slug} className="rounded-2xl border p-4 hover:shadow-sm transition">
            <Link href={`/codex/${i.slug}`} className="block">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium">{i.title}</h2>
                <div className="flex items-center gap-2">
                  {i.updated && <time className="text-sm opacity-70">{i.updated}</time>}
                  {i.updated &&
                    Date.now() - new Date(i.updated).getTime() < 1000 * 60 * 60 * 24 * 30 && (
                      <span className="ml-2 text-xs rounded bg-black text-white px-2 py-0.5">new</span>
                    )}
                </div>
              </div>
              {i.tags && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {i.tags.map((t) => (
                    <span key={t} className="text-xs rounded-xl border px-2 py-0.5">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="opacity-70">No prompts match your search.</li>
        )}
      </ul>
    </main>
  );
}
