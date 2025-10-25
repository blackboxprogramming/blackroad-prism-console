import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ThreadDetail } from '@/components/thread-detail';
import { ThreadDetailSkeleton } from '@/components/thread-skeleton';
import { fetchThread } from '@/lib/server-fetchers';

interface ThreadPageProps {
  params: { threadId: string };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const thread = await fetchThread(params.threadId);

  if (!thread) {
    notFound();
  }

  return (
    <section aria-labelledby="thread-heading" className="space-y-6">
      <Suspense fallback={<ThreadDetailSkeleton />}>
        <ThreadDetail thread={thread} />
      </Suspense>
    </section>
  );
}
