'use client';

import { DashboardSummary } from '@/components/DashboardSummary';
import { MetricsGrid } from '@/components/MetricsGrid';
import { ShortcutList } from '@/components/ShortcutList';
import { useDashboard } from '@/features/use-dashboard';
import { useTelemetry } from '@/lib/telemetry';
import { useEffect } from 'react';

export function OverviewContent() {
  const { data, isLoading, error } = useDashboard();
  const { track } = useTelemetry();

  useEffect(() => {
    track({ type: 'screen:view', screen: 'overview' });
  }, [track]);

  if (isLoading) {
    return <p className="text-slate-400">Loading dashboard…</p>;
  }

  if (error) {
    track({ type: 'error', message: (error as Error).message });
    return <p className="text-rose-400">Failed to load dashboard.</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <DashboardSummary summary={data.summary} />
      <MetricsGrid metrics={data.metrics} />
      <ShortcutList shortcuts={data.shortcuts} />
    </div>
  );
}
