import { NextResponse } from 'next/server';
import { readFixture, writeFixture } from '@/mocks/utils';
import { roomsResponseSchema, roomSchema } from '@/lib/schemas';
import type { RoomsResponse, CampfireRoom } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { toIsoString } from '@/lib/time';

export async function GET() {
  const data = readFixture<RoomsResponse>('rooms.json');
  return NextResponse.json(roomsResponseSchema.parse(data));
}

export async function POST(request: Request) {
  const body = await request.json();
  const now = new Date();
  const room = roomSchema.parse({
    ...body,
    id: body.id ?? `room-${nanoid()}`,
    createdAt: now.toISOString(),
    expiresAt: body.expiresAt ?? toIsoString(now.getTime() + 1000 * 60 * 60 * 12),
    createdBy: body.createdBy ?? 'ember',
    members: body.members ?? ['ember'],
  }) satisfies CampfireRoom;

  const data = readFixture<RoomsResponse>('rooms.json');
  data.rooms.unshift(room);
  writeFixture('rooms.json', data);
  return NextResponse.json(room, { status: 201 });
}
