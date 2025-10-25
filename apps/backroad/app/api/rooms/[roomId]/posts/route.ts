import { NextResponse } from 'next/server';
import { readFixture, writeFixture } from '@/mocks/utils';
import type { Post } from '@/lib/types';
import { postSchema } from '@/lib/schemas';
import { nanoid } from '@/lib/utils';

interface Params {
  params: { roomId: string };
}

export async function POST(request: Request, { params }: Params) {
  const body = await request.json();
  const posts = readFixture<Record<string, Post[]>>('posts.json');
  const newPost = postSchema.parse({
    ...body,
    id: `post-${nanoid()}`,
    roomId: params.roomId,
    state: 'queued',
    createdAt: new Date().toISOString(),
  });
  const list = posts[params.roomId] ?? [];
  posts[params.roomId] = [newPost, ...list];
  writeFixture('posts.json', posts);
  return NextResponse.json(newPost, { status: 201 });
}
