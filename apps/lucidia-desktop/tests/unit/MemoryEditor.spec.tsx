import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryEditor } from '../../src/ui/components/Codex/MemoryEditor';

expect.extend(toHaveNoViolations);

describe('MemoryEditor', () => {
  const doc = {
    id: '1',
    title: 'Sample',
    tags: ['tag'],
    content: 'Hello **world**',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    vector: []
  };

  it('switches to preview mode', () => {
    render(<MemoryEditor doc={doc} />);
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<MemoryEditor doc={doc} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
