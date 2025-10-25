import { RunbookList } from '@/components/RunbookList';
import { fetchDashboard } from '@/features/dashboard-api';

export const revalidate = 0;

export default async function RunbooksPage() {
  await fetchDashboard();
  return <RunbookList />;
}
