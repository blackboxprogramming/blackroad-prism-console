import type { Meta, StoryObj } from '@storybook/react';
import { DashboardSummary } from '@/components/DashboardSummary';
import { MetricsGrid } from '@/components/MetricsGrid';
import { ShortcutList } from '@/components/ShortcutList';
import payload from '../mocks/dashboard.json';

const meta: Meta = {
  title: 'Dashboard/Overview',
  render: () => (
    <div className="space-y-6">
      <DashboardSummary summary={payload.summary} />
      <MetricsGrid metrics={payload.metrics} />
      <ShortcutList shortcuts={payload.shortcuts} />
    </div>
  )
};

export default meta;
export const Default: StoryObj = {};
