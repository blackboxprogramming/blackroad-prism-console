import { NextResponse } from 'next/server';
import { readFixture } from '@/mocks/utils';
import { profileSchema } from '@/lib/schemas';
import type { Profile } from '@/lib/types';

export async function GET() {
  const profile = readFixture<Profile>('profile.json');
  return NextResponse.json(profileSchema.parse(profile));
}
