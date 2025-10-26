import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TaskPane } from '../../src/ui/components/Tasks/TaskPane';
expect.extend(toHaveNoViolations);

describe('TaskPane', () => {
  it('renders without tasks', () => {
    render(<TaskPane />);
    expect(screen.getByText('Select a task to view details.')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<TaskPane />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
