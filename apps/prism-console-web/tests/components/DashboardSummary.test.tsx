import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardSummary } from '@/components/DashboardSummary';

describe('DashboardSummary', () => {
  it('renders summary text', () => {
    render(<DashboardSummary summary="All systems nominal" />);
    expect(screen.getByText(/All systems nominal/i)).toBeInTheDocument();
  });
});
