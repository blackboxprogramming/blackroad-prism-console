import { render, screen } from '@testing-library/react';
import { CredibilityBadge } from '../components/CredibilityBadge';

describe('CredibilityBadge', () => {
  it('renders formatted score and confidence', () => {
    render(<CredibilityBadge credScore={92} confidence={0.85} />);

    expect(screen.getByText(/Credibility\s+92\/100/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('title', expect.stringContaining('85'));
  });

  it('applies positive tone for high scores', () => {
    render(<CredibilityBadge credScore={92} confidence={0.9} />);
    expect(screen.getByRole('status').className).toContain('emerald');
  });

  it('applies warning tone for mid scores', () => {
    render(<CredibilityBadge credScore={60} confidence={0.9} />);
    expect(screen.getByRole('status').className).toContain('amber');
  });

  it('applies alert tone for low scores', () => {
    render(<CredibilityBadge credScore={20} confidence={0.9} />);
    expect(screen.getByRole('status').className).toContain('rose');
  });
});
