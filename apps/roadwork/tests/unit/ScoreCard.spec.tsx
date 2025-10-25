import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreCard } from '@/components/feedback/ScoreCard';
import { MasteryFeedback } from '@/components/feedback/MasteryFeedback';

describe('Feedback components', () => {
  it('shows score value', () => {
    render(<ScoreCard score={88} />);
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('shows mastery label', () => {
    render(<MasteryFeedback score={70} />);
    expect(screen.getByText(/Keep building/i)).toBeInTheDocument();
  });
});
