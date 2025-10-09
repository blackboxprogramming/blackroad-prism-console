import { loadFlags } from '@/packages/flags/store';
import type { FlagsDoc } from '@/packages/flags/types';
import FlagsAdminClient from './FlagsAdminClient';

export const dynamic = 'force-dynamic';

export default async function FlagsAdminPage() {
  const paramName =
    process.env.FLAGS_PARAM ||
    process.env.NEXT_PUBLIC_FLAGS_PARAM ||
    '/blackroad/dev/flags';
  const doc: FlagsDoc = await loadFlags(paramName, 0);
  return <FlagsAdminClient initialDoc={doc} paramName={paramName} />;
}
