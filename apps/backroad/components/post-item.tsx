'use client';

import { formatDistanceToNow } from 'date-fns';
import { markdownToHtml } from '@/lib/markdown';
import { TimeBadge } from '@/components/time-badge';
import type { Post } from '@/lib/types';

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  const isVisible = post.state === 'visible' && new Date(post.visibleAt) <= new Date();
  const content = markdownToHtml(post.markdown);

  return (
    <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Posted by @{post.authorId}</span>
        <span>
          {isVisible
            ? `Visible ${formatDistanceToNow(new Date(post.visibleAt), { addSuffix: true })}`
            : 'Queued'}
        </span>
      </header>
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {!isVisible && <TimeBadge visibleAt={post.visibleAt} />}
    </article>
  );
}
