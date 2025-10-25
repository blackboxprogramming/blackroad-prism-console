import { NextResponse } from 'next/server';
import { readFixture, writeFixture } from '@/mocks/utils';
import type { Post } from '@/lib/types';
import { postSchema } from '@/lib/schemas';
import { nanoid } from '@/lib/utils';

interface Params {
  params: { threadId: string };
}

export async function POST(request: Request, { params }: Params) {
  const body = await request.json();
  const posts = readFixture<Record<string, Post[]>>('posts.json');
  const newPost = postSchema.parse({
    ...body,
    id: `post-${nanoid()}`,
    threadId: params.threadId,
    state: 'queued',
    createdAt: new Date().toISOString(),
  });
  const list = posts[params.threadId] ?? [];
  posts[params.threadId] = [newPost, ...list];
  writeFixture('posts.json', posts);
  return NextResponse.json(newPost, { status: 201 });
}
