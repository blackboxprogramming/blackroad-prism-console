'use server';

import type { FlagsDoc } from '@/packages/flags/types';

const { saveFlagsDoc } = require('@/packages/flags/store');

export async function saveFlagsAction(doc: FlagsDoc) {
  const paramName =
    process.env.FLAGS_PARAM ||
    process.env.NEXT_PUBLIC_FLAGS_PARAM ||
    '/blackroad/dev/flags';
  const payload: FlagsDoc = {
    features: doc.features || {},
    segments: doc.segments,
    version: doc.version,
  };
  const next = await saveFlagsDoc(payload, paramName);
  return next;
}
