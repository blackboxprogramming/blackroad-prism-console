'use client';

import { useThread } from '@/hooks/use-thread';
import { PostItem } from '@/components/post-item';
import { PostComposer } from '@/components/post-composer';
import type { Thread } from '@/lib/types';

interface ThreadDetailProps {
  thread: Thread;
}

export function ThreadDetail({ thread }: ThreadDetailProps) {
  const { data, isLoading, error } = useThread(thread.id);

  return (
    <div className="space-y-6">
      <header className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-semibold text-slate-50">{thread.title}</h1>
          <p className="text-xs text-slate-400">Opened by @{thread.createdBy}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-100"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>
      <section aria-label="Thread posts" className="space-y-4">
        {isLoading && <p className="text-sm text-slate-300">Loading posts…</p>}
        {error && (
          <p role="alert" className="rounded-md border border-red-700/60 bg-red-900/30 p-4 text-red-200">
            Failed to load posts.
          </p>
        )}
        <ul className="space-y-4">
          {data?.posts?.map((post) => (
            <li key={post.id}>
              <PostItem post={post} />
            </li>
          ))}
        </ul>
      </section>
      <PostComposer threadId={thread.id} />
    </div>
  );
}
