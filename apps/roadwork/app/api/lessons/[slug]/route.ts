import { NextResponse } from 'next/server';
import lessonsData from '@/mocks/fixtures/lessons.json';
import { lessonSchema } from '@/lib/schemas';

export function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const lesson = lessonsData.lessons.find((item) => item.slug === params.slug);
  if (!lesson) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ lesson: lessonSchema.parse(lesson) });
}
