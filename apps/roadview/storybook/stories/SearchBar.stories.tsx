'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchBar } from '../../components/SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar
};

export default meta;

type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('RoadView intelligence');
    return (
      <SearchBar
        value={value}
        onChange={setValue}
        onSubmit={() => {}}
        onDebouncedChange={() => {}}
        placeholder="Search credible intelligence..."
      />
    );
  }
};
