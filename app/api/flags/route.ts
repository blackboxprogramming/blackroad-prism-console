import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { FlagsDoc } from '@/packages/flags/types';

const { loadFlags } = require('@/packages/flags/store');
const { isOn } = require('@/packages/flags/eval');

const PARAM_NAME =
  process.env.NEXT_PUBLIC_FLAGS_PARAM ||
  process.env.FLAGS_PARAM ||
  '/blackroad/dev/flags';

export async function GET(req: NextRequest) {
  try {
    const doc: FlagsDoc = await loadFlags(PARAM_NAME);
    const uid = req.cookies.get('br_uid')?.value;
    const email = req.headers.get('x-user-email') || undefined;
    const ctx = {
      userId: uid,
      email: email || undefined,
      reqId: randomUUID(),
    };

    const features = {
      prismGithub: isOn(doc, 'prism.github.tiles', ctx),
      prismLinear: isOn(doc, 'prism.linear.tiles', ctx),
      prismStripe: isOn(doc, 'prism.stripe.tiles', ctx),
    };

    return NextResponse.json(
      { features, version: doc.version ?? 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      {
        features: {
          prismGithub: false,
          prismLinear: false,
          prismStripe: false,
        },
        version: 0,
        error: 'flags_unavailable',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
