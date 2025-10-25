import type { Meta, StoryObj } from '@storybook/react';
import { CredibilityBadge } from '../../components/CredibilityBadge';

const meta: Meta<typeof CredibilityBadge> = {
  title: 'Components/CredibilityBadge',
  component: CredibilityBadge,
  args: {
    credScore: 86,
    confidence: 0.93
  }
};

export default meta;

type Story = StoryObj<typeof CredibilityBadge>;

export const HighConfidence: Story = {};
export const MediumConfidence: Story = {
  args: { credScore: 60, confidence: 0.7 }
};
export const LowConfidence: Story = {
  args: { credScore: 30, confidence: 0.5 }
};
