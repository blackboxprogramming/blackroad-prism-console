import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionFrame } from '@/components/practice/QuestionFrame';

describe('QuestionFrame', () => {
  it('renders title and description', () => {
    render(
      <QuestionFrame id="q1" title="Question" description="Describe this">
        <div>Child</div>
      </QuestionFrame>
    );
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('Describe this')).toBeInTheDocument();
  });
});
