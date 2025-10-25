import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { RoomDetail } from '@/components/room-detail';
import { RoomDetailSkeleton } from '@/components/room-skeleton';
import { fetchRoom } from '@/lib/server-fetchers';

interface RoomPageProps {
  params: { roomId: string };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const room = await fetchRoom(params.roomId);

  if (!room) {
    notFound();
  }

  return (
    <section aria-labelledby="room-heading" className="space-y-6">
      <Suspense fallback={<RoomDetailSkeleton />}>
        <RoomDetail room={room} />
      </Suspense>
    </section>
  );
}
