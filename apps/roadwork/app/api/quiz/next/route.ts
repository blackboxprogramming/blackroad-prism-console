import { NextResponse } from 'next/server';
import questionsData from '@/mocks/fixtures/questions.json';
import { quizNextResponseSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const attemptId: string | undefined = body.attemptId;
  if (!attemptId) {
    return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
  }
  const allQuestions = Object.values(questionsData as Record<string, any[]>).flat();
  const index = Math.floor(Math.random() * allQuestions.length);
  const question = allQuestions[index];
  return NextResponse.json(quizNextResponseSchema.parse({ question }));
}
