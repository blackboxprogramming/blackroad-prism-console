import { NextResponse } from 'next/server';
import questionsData from '@/mocks/fixtures/questions.json';
import { questionsResponseSchema } from '@/lib/schemas';

export function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const questions = (questionsData as Record<string, unknown>)[params.slug];
  if (!Array.isArray(questions)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const parsed = questionsResponseSchema.parse({ questions });
  return NextResponse.json(parsed);
}
