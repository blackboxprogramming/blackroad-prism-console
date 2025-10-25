'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Thread } from '@/lib/types';
import { TagPill } from '@/components/tag-pill';

interface ThreadCardProps {
  thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
      <header className="space-y-2">
        <Link
          href={`/threads/${thread.id}`}
          className="text-xl font-semibold text-slate-50 transition hover:text-brand-200"
        >
          {thread.title}
        </Link>
        <p className="text-xs text-slate-400">
          Opened {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
        </p>
        <div className="flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      </header>
      <footer className="mt-4 text-xs text-slate-400">
        Created by @{thread.createdBy}
      </footer>
    </article>
  );
}
