import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimeBadge } from '@/components/time-badge';

vi.useFakeTimers();

describe('TimeBadge', () => {
  it('shows remaining time before visibility', () => {
    const visibleAt = new Date(Date.now() + 60_000).toISOString();
    render(<TimeBadge visibleAt={visibleAt} />);
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();
  });

  it('shows visible when time passed', () => {
    const visibleAt = new Date(Date.now() - 60_000).toISOString();
    render(<TimeBadge visibleAt={visibleAt} />);
    expect(screen.getByText(/visible/i)).toBeInTheDocument();
  });
});
