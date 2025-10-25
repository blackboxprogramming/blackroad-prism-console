'use client';

import Link from 'next/link';
import { useRooms } from '@/hooks/use-rooms';
import { RoomCard } from '@/components/room-card';

export function RoomList() {
  const { data, isLoading, error } = useRooms();

  if (isLoading) {
    return <p className="text-sm text-slate-300">Loading rooms…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md border border-red-700/60 bg-red-900/30 p-4 text-red-200">
        Unable to load campfire rooms right now.
      </p>
    );
  }

  if (!data?.rooms?.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-lg font-medium text-slate-100">No rooms currently burning.</p>
        <p className="mt-2 text-sm text-slate-300">Start one to invite a focused gathering.</p>
        <Link
          href="/compose"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-500/20 px-4 py-2 text-sm font-medium text-brand-100 transition hover:bg-brand-500/30"
        >
          Create a thread
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {data.rooms.map((room) => (
        <li key={room.id}>
          <RoomCard room={room} />
        </li>
      ))}
    </ul>
  );
}
