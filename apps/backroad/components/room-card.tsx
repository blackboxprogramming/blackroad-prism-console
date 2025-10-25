'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { CampfireRoom } from '@/lib/types';
import { ExpiryRing } from '@/components/expiry-ring';

interface RoomCardProps {
  room: CampfireRoom;
}

export function RoomCard({ room }: RoomCardProps) {
  const expiresIn = formatDistanceToNow(new Date(room.expiresAt), { addSuffix: true });

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/rooms/${room.id}`}
            className="text-xl font-semibold text-slate-50 transition hover:text-brand-200"
          >
            {room.topic}
          </Link>
          <ExpiryRing expiresAt={room.expiresAt} size={48} />
        </div>
        <p className="text-xs text-slate-400">
          Created {formatDistanceToNow(new Date(room.createdAt), { addSuffix: true })}
        </p>
      </header>
      <footer className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{room.inviteOnly ? 'Invite only' : 'Open room'}</span>
        <span>Ends {expiresIn}</span>
      </footer>
    </article>
  );
}
