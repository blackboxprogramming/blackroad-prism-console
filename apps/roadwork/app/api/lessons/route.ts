import { NextResponse } from 'next/server';
import lessonsData from '@/mocks/fixtures/lessons.json';
import { lessonsResponseSchema } from '@/lib/schemas';

export function GET() {
  const parsed = lessonsResponseSchema.parse(lessonsData);
  return NextResponse.json(parsed);
}
