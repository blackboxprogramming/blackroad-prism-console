import { RunbookList } from '@/components/RunbookList';
import { fetchDashboard } from '@/features/dashboard-api';

export const revalidate = 0;

export default async function RunbooksPage() {
  await fetchDashboard();
  return <RunbookList />;
"use client";

import { ShortcutGrid } from "@/components/ShortcutGrid";
import { useDashboard } from "@/hooks/useDashboard";

export default function RunbooksPage() {
  const { data: dashboard, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Runbooks</h2>
        <p className="text-sm text-slate-400">Fire off orchestrations aligned with the Prism CLI toolkit.</p>
      </div>
      {isLoading && <p className="text-sm text-slate-400">Loading runbooks...</p>}
      {dashboard && <ShortcutGrid shortcuts={dashboard.shortcuts} />}
    </div>
  );
}
