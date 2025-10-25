import { AgentTable } from '@/components/AgentTable';
import { ShortcutList } from '@/components/ShortcutList';
import { fetchDashboard } from '@/features/dashboard-api';

export const revalidate = 0;

export default async function AgentsPage() {
  const payload = await fetchDashboard();

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]" aria-labelledby="agents-heading">
      <AgentTable shortcuts={payload.shortcuts} />
      <ShortcutList shortcuts={payload.shortcuts} />
    </div>
  );
}
