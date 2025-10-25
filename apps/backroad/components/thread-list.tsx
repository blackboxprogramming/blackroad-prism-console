'use client';

import Link from 'next/link';
import { useThreads } from '@/hooks/use-threads';
import { ThreadCard } from '@/components/thread-card';
import { ThreadFilters } from '@/components/thread-search';

export function ThreadList() {
  const { data, isLoading, error } = useThreads();

  if (isLoading) {
    return <p className="text-sm text-slate-300">Loading threads…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md border border-red-700/60 bg-red-900/30 p-4 text-red-200">
        Unable to load threads. Try refreshing the page.
      </p>
    );
  }

  if (!data?.threads?.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-lg font-medium text-slate-100">No threads yet.</p>
        <p className="mt-2 text-sm text-slate-300">
          Be the first to start a thoughtful conversation.
        </p>
        <Link
          href="/compose"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-500/20 px-4 py-2 text-sm font-medium text-brand-100 transition hover:bg-brand-500/30"
        >
          Compose a post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ThreadFilters />
      <ul className="grid gap-4 md:grid-cols-2">
        {data.threads.map((thread) => (
          <li key={thread.id}>
            <ThreadCard thread={thread} />
          </li>
        ))}
      </ul>
    </div>
  );
}
