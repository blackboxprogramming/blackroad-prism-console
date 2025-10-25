'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FiltersPanel } from '../../components/FiltersPanel';
import type { FiltersPanelProps } from '../../components/FiltersPanel';

const meta: Meta<typeof FiltersPanel> = {
  title: 'Components/FiltersPanel',
  component: FiltersPanel
};

export default meta;

type Story = StoryObj<typeof FiltersPanel>;

const baseFacets: FiltersPanelProps['facets'] = {
  sourceType: { news: 5, gov: 3, paper: 2 },
  bias: { left: 2, center: 4, na: 1 },
  domains: { 'example.com': 5 }
};

export const Interactive: Story = {
  render: () => {
    const [sourceTypes, setSourceTypes] = useState<Set<string>>(new Set());
    const [biases, setBiases] = useState<Set<string>>(new Set());
    const [minCred, setMinCred] = useState<number | null>(null);
    const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

    return (
      <FiltersPanel
        facets={baseFacets}
        selectedSourceTypes={sourceTypes}
        selectedBiases={biases}
        minCredScore={minCred}
        dateRange={dateRange}
        onToggleSourceType={(value) =>
          setSourceTypes((prev) => {
            const next = new Set(prev);
            next.has(value) ? next.delete(value) : next.add(value);
            return next;
          })
        }
        onToggleBias={(value) =>
          setBiases((prev) => {
            const next = new Set(prev);
            next.has(value) ? next.delete(value) : next.add(value);
            return next;
          })
        }
        onMinCredScoreChange={setMinCred}
        onDateRangeChange={setDateRange}
        onReset={() => {
          setSourceTypes(new Set());
          setBiases(new Set());
          setMinCred(null);
          setDateRange({});
        }}
      />
    );
  }
};
