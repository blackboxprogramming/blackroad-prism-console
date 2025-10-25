import { NextResponse } from 'next/server';
import { readFixture, writeFixture } from '@/mocks/utils';
import type { Post } from '@/lib/types';
import { postSchema } from '@/lib/schemas';

interface Params {
  params: { postId: string };
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();
  const posts = readFixture<Record<string, Post[]>>('posts.json');
  let updated: Post | undefined;

  Object.entries(posts).forEach(([key, list]) => {
    posts[key] = list.map((post) => {
      if (post.id === params.postId) {
        updated = postSchema.parse({ ...post, ...body, editedAt: new Date().toISOString() });
        return updated;
      }
      return post;
    });
  });

  if (!updated) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  writeFixture('posts.json', posts);
  return NextResponse.json(updated);
}
