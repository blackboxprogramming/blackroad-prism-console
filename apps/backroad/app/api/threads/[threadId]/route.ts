import { NextResponse } from 'next/server';
import { readFixture } from '@/mocks/utils';
import { threadResponseSchema } from '@/lib/schemas';
import type { ThreadsResponse, ThreadResponse } from '@/lib/types';

interface Params {
  params: { threadId: string };
}

export async function GET(_: Request, { params }: Params) {
  const threads = readFixture<ThreadsResponse>('threads.json');
  const posts = readFixture<Record<string, ThreadResponse['posts']>>('posts.json');
  const thread = threads.threads.find((item) => item.id === params.threadId);

  if (!thread) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  const response: ThreadResponse = { thread, posts: posts[params.threadId] ?? [] };
  const parsed = threadResponseSchema.parse(response);
  return NextResponse.json(parsed);
}
