import { NextRequest, NextResponse } from 'next/server';
import { readFixture } from '@/mocks/utils';
import { threadsResponseSchema, searchResponseSchema } from '@/lib/schemas';
import type { ThreadsResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') ?? '').toLowerCase();
  const tag = searchParams.get('tag');
  const data = readFixture<ThreadsResponse>('threads.json');
  const parsed = threadsResponseSchema.parse(data);
  const filtered = parsed.threads.filter((thread) => {
    const matchesQuery = query ? thread.title.toLowerCase().includes(query) : true;
    const matchesTag = tag ? thread.tags.includes(tag) : true;
    return matchesQuery && matchesTag;
  });
  return NextResponse.json(searchResponseSchema.parse({ threads: filtered }));
}
