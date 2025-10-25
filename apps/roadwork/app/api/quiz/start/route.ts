import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import lessonsData from '@/mocks/fixtures/lessons.json';
import questionsData from '@/mocks/fixtures/questions.json';
import { quizStartResponseSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const slug = body.slug ?? lessonsData.lessons[0]?.slug;
  const lesson = lessonsData.lessons.find((item) => item.slug === slug) ?? lessonsData.lessons[0];
  const candidates = (questionsData as Record<string, any>)[lesson.slug] ?? [];
  const question = candidates[0];
  const payload = {
    attemptId: randomUUID(),
    lessonId: lesson.id,
    firstQuestion: question
  };
  return NextResponse.json(quizStartResponseSchema.parse(payload));
}
