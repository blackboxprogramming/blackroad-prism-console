'use client';

import { SearchResult } from '../lib/schema';
import { formatDate } from '../lib/format';
import { CredibilityBadge } from './CredibilityBadge';
import { SourceTransparencyPanel } from './SourceTransparencyPanel';

type ResultCardProps = {
  result: SearchResult;
};

export function ResultCard({ result }: ResultCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg" aria-labelledby={`result-${result.id}`}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 id={`result-${result.id}`} className="text-xl font-semibold text-white">
            <a href={result.url} target="_blank" rel="noreferrer" className="hover:underline">
              {result.title}
            </a>
          </h3>
          <p className="text-sm text-slate-300">{result.snippet}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-200">{result.domain}</span>
            <span className="rounded-full bg-slate-800 px-2 py-1 capitalize text-slate-200">{result.sourceType}</span>
            <span className="rounded-full bg-slate-800 px-2 py-1 capitalize text-slate-200">Bias: {result.bias}</span>
            <time dateTime={result.publishedAt} className="rounded-full bg-slate-800 px-2 py-1 text-slate-200">
              {formatDate(result.publishedAt)}
            </time>
          </div>
        </div>
        <CredibilityBadge credScore={result.credScore} confidence={result.confidence} />
      </header>
      <SourceTransparencyPanel
        domain={result.domain}
        bias={result.bias}
        lastSeen={result.publishedAt}
        confidence={result.confidence}
        url={result.url}
      />
    </article>
  );
}
