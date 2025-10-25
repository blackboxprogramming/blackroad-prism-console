import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { LessonHeader } from '@/components/lesson/LessonHeader';
import { ObjectivesList } from '@/components/lesson/ObjectivesList';

const lesson = {
  id: 'l',
  slug: 'slug',
  title: 'Lesson title',
  summary: 'Summary',
  content: '',
  tags: ['tag'],
  estMinutes: 15,
  outcomes: ['Outcome one']
};

describe('Lesson accessibility', () => {
  it('passes axe rules', async () => {
    const { container } = render(
      <div>
        <LessonHeader lesson={lesson} />
        <ObjectivesList objectives={lesson.outcomes} />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
