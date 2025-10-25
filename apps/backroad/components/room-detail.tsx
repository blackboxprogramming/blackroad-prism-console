'use client';

import { useRoom } from '@/hooks/use-room';
import { PostItem } from '@/components/post-item';
import { PostComposer } from '@/components/post-composer';
import type { CampfireRoom } from '@/lib/types';
import { ExpiryRing } from '@/components/expiry-ring';

interface RoomDetailProps {
  room: CampfireRoom;
}

export function RoomDetail({ room }: RoomDetailProps) {
  const { data, isLoading, error } = useRoom(room.id);
  const expired = new Date(room.expiresAt) <= new Date();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-50">{room.topic}</h1>
          <p className="text-xs text-slate-400">
            {room.inviteOnly ? 'Invite only' : 'Open to all thoughtful travelers'} · Expires at{' '}
            {new Date(room.expiresAt).toLocaleString()}
          </p>
        </div>
        <ExpiryRing expiresAt={room.expiresAt} />
      </header>
      <section aria-label="Room posts" className="space-y-4">
        {isLoading && <p className="text-sm text-slate-300">Loading posts…</p>}
        {error && (
          <p role="alert" className="rounded-md border border-red-700/60 bg-red-900/30 p-4 text-red-200">
            Failed to load room posts.
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
      {expired ? (
        <p className="text-sm text-slate-400">This room has expired and is now read-only.</p>
      ) : (
        <PostComposer roomId={room.id} />
      )}
    </div>
  );
}
