"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import Link from "next/link";
import { getSearchIndex } from "@/lib/runbook-data";

const fuse = new Fuse(getSearchIndex(), {
  includeScore: true,
  threshold: 0.3,
  keys: ["title", "summary", "tags", "owners"]
});

export function SearchBar() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 6);
  }, [query]);

  return (
    <div className="relative" role="search">
      <label htmlFor="global-search" className="sr-only">
        Search docs and runbooks
      </label>
      <input
        id="global-search"
        type="search"
        placeholder="Search runbooks"
        className="rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {results.length > 0 ? (
        <ul className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-900/95 p-2 shadow-xl" role="listbox">
          {results.map((result) => (
            <li key={result.item.id} className="rounded-md px-2 py-2 hover:bg-slate-800">
              <Link href={`/runbooks/${result.item.id}`}>
                <div className="text-sm font-semibold text-slate-100">{result.item.title}</div>
                <div className="text-xs text-slate-400">{result.item.summary}</div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
