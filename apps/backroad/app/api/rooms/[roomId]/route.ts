import { NextResponse } from 'next/server';
import { readFixture } from '@/mocks/utils';
import { roomResponseSchema } from '@/lib/schemas';
import type { RoomsResponse, RoomResponse, Post } from '@/lib/types';

interface Params {
  params: { roomId: string };
}

export async function GET(_: Request, { params }: Params) {
  const rooms = readFixture<RoomsResponse>('rooms.json');
  const posts = readFixture<Record<string, Post[]>>('posts.json');
  const room = rooms.rooms.find((item) => item.id === params.roomId);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const response: RoomResponse = { room, posts: posts[params.roomId] ?? [] };
  return NextResponse.json(roomResponseSchema.parse(response));
}
