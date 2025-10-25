'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { SourceTransparencyPanel } from '../../components/SourceTransparencyPanel';

const meta: Meta<typeof SourceTransparencyPanel> = {
  title: 'Components/SourceTransparencyPanel',
  component: SourceTransparencyPanel
};

export default meta;

type Story = StoryObj<typeof SourceTransparencyPanel>;

export const Collapsible: Story = {
  args: {
    domain: 'analysislog.io',
    bias: 'left',
    lastSeen: '2024-03-10T12:00:00.000Z',
    confidence: 0.72,
    url: 'https://analysislog.io/global-logistics-trends'
  }
};
