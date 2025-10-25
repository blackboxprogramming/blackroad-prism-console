import type { Meta, StoryObj } from '@storybook/react';
import { ResultCard } from '../../components/ResultCard';

const meta: Meta<typeof ResultCard> = {
  title: 'Components/ResultCard',
  component: ResultCard
};

export default meta;

type Story = StoryObj<typeof ResultCard>;

export const Example: Story = {
  args: {
    result: {
      id: 'storybook',
      title: 'Storybook renders RoadView result',
      snippet: 'RoadView presents each result with transparency metadata and credibility scoring.',
      url: 'https://blackroad.io/roadview',
      domain: 'blackroad.io',
      sourceType: 'news',
      bias: 'center',
      credScore: 85,
      publishedAt: '2024-05-01T00:00:00.000Z',
      confidence: 0.88
    }
  }
};
