import type { Meta, StoryObj } from '@storybook/react';
import { LessonCard } from './LessonCard';

const meta: Meta<typeof LessonCard> = {
  title: 'Catalog/LessonCard',
  component: LessonCard
};

export default meta;

type Story = StoryObj<typeof LessonCard>;

export const Default: Story = {
  args: {
    lesson: {
      id: 'l',
      slug: 'demo',
      title: 'Demo lesson',
      summary: 'Practice summary',
      content: '',
      tags: ['demo'],
      estMinutes: 20,
      outcomes: ['Outcome']
    }
  }
};
