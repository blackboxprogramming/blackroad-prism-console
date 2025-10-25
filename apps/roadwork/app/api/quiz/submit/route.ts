import { NextResponse } from 'next/server';
import { quizSubmitResponseSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.attemptId) {
    return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
  }
  const score = Math.floor(Math.random() * 40) + 60;
  const payload = { score, masteryDelta: score > 80 ? 1 : score < 60 ? -1 : 0 };
  return NextResponse.json(quizSubmitResponseSchema.parse(payload));
}
