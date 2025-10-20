"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DocSummary = { slug: string; title: string };

type DocsListProps = {
  docs: DocSummary[];
};

export function DocsList({ docs }: DocsListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return docs;
    }
    return docs.filter((doc) => doc.title.toLowerCase().includes(value));
  }, [docs, query]);

  return (
    <>
      <input
        className="w-full mb-6 rounded-xl bg-ink-800/60 px-3 py-2"
        placeholder="Search docs…"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {filtered.map((doc) => (
          <li key={doc.slug} className="card">
            <Link
              href={`/docs/${doc.slug}`}
              className="text-lg font-semibold hover:underline"
            >
              {doc.title}
            </Link>
            <div className="mt-2 break-all text-zinc-400">{doc.slug}</div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-ink-700/80 bg-ink-900/60 p-4 text-sm text-zinc-400">
            No docs match that query yet.
          </li>
        )}
      </ul>
    </>
  );
}
