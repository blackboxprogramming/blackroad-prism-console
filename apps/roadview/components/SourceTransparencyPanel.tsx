'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDate, formatConfidence } from '../lib/format';

type SourceTransparencyPanelProps = {
  domain: string;
  bias: string;
  lastSeen: string;
  confidence: number;
  url: string;
};

export function SourceTransparencyPanel({ domain, bias, lastSeen, confidence, url }: SourceTransparencyPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-200"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>Source transparency</span>
        {expanded ? <ChevronUp aria-hidden className="h-4 w-4" /> : <ChevronDown aria-hidden className="h-4 w-4" />}
      </button>
      {expanded && (
        <dl className="grid gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-200">Domain</dt>
            <dd className="mt-1 break-words text-slate-300">{domain}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-200">Bias tag</dt>
            <dd className="mt-1 capitalize text-slate-300">{bias}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-200">Last seen</dt>
            <dd className="mt-1 text-slate-300">{formatDate(lastSeen)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-200">Confidence</dt>
            <dd className="mt-1 text-slate-300">{formatConfidence(confidence)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-200">Visit source</dt>
            <dd className="mt-1">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-brand-300 hover:text-brand-200"
              >
                {url}
                <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
