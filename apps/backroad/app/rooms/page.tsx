import { Suspense } from 'react';
import { RoomList } from '@/components/room-list';
import { RoomsSkeleton } from '@/components/room-skeleton';

export const dynamic = 'force-dynamic';

export default function RoomsPage() {
  return (
    <section aria-labelledby="rooms-heading" className="space-y-6">
      <header>
        <h1 id="rooms-heading" className="text-3xl font-semibold text-slate-50">
          Campfire Rooms
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Ephemeral gathering spaces that encourage presence. Rooms expire after twelve hours.
        </p>
      </header>
      <Suspense fallback={<RoomsSkeleton />}>
        <RoomList />
      </Suspense>
    </section>
  );
}
