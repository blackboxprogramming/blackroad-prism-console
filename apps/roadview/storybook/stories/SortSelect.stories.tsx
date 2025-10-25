'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SortSelect } from '../../components/SortSelect';
import type { SortOption } from '../../hooks/useFilters';

const meta: Meta<typeof SortSelect> = {
  title: 'Components/SortSelect',
  component: SortSelect
};

export default meta;

type Story = StoryObj<typeof SortSelect>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<SortOption>('recency');
    return <SortSelect value={value} onChange={setValue} />;
  }
};
