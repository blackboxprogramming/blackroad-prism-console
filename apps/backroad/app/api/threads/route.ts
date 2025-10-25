import { NextResponse } from 'next/server';
import { readFixture, writeFixture } from '@/mocks/utils';
import { threadsResponseSchema, threadSchema, postSchema } from '@/lib/schemas';
import type { ThreadsResponse, Thread, Post } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { defaultDelayMs, toIsoString } from '@/lib/time';

export async function GET() {
  const data = readFixture<ThreadsResponse>('threads.json');
  const parsed = threadsResponseSchema.parse(data);
  return NextResponse.json(parsed);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newThread = threadSchema.parse({
    ...body,
    id: body.id ?? `thread-${nanoid()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: body.createdBy ?? 'ember',
    tags: body.tags ?? [],
    title: body.title ?? deriveTitle(body.markdown ?? 'New Thread'),
  }) satisfies Thread;

  const data = readFixture<ThreadsResponse>('threads.json');
  data.threads.unshift(newThread);
  writeFixture('threads.json', data);

  if (body.markdown) {
    const posts = readFixture<Record<string, Post[]>>('posts.json');
    const newPost = postSchema.parse({
      id: `post-${nanoid()}`,
      threadId: newThread.id,
      authorId: body.createdBy ?? 'ember',
      createdAt: new Date().toISOString(),
      visibleAt: body.visibleAt ?? toIsoString(Date.now() + (body.delayMs ?? defaultDelayMs)),
      state: 'queued',
      markdown: body.markdown,
    });
    const list = posts[newThread.id] ?? [];
    posts[newThread.id] = [newPost, ...list];
    writeFixture('posts.json', posts);
  }

  return NextResponse.json(newThread, { status: 201 });
}

function deriveTitle(markdown: string): string {
  const line = markdown.split('\n').find((item) => item.trim().length > 0);
  return line ? line.trim().slice(0, 80) : 'New Thread';
}
