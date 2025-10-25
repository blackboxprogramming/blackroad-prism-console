import { SettingsPanel } from '@/components/SettingsPanel';
import { fetchDashboard } from '@/features/dashboard-api';

export const revalidate = 0;

export default async function SettingsPage() {
  await fetchDashboard();
  return <SettingsPanel />;
}
