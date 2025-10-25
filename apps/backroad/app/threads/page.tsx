import { Suspense } from 'react';
import { ThreadList } from '@/components/thread-list';
import { ThreadsSkeleton } from '@/components/thread-skeleton';

export const dynamic = 'force-dynamic';

export default function ThreadsPage() {
  return (
    <section aria-labelledby="threads-heading" className="space-y-6">
      <header>
        <h1 id="threads-heading" className="text-3xl font-semibold text-slate-50">
          Campfire Threads
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Slow social designed for depth. Posts queue for a few hours before appearing, giving
          everyone space to reflect.
        </p>
      </header>
      <Suspense fallback={<ThreadsSkeleton />}>
        <ThreadList />
      </Suspense>
    </section>
  );
}
