import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Composer } from '../../src/ui/components/Chat/Composer';

expect.extend(toHaveNoViolations);

describe('Composer', () => {
  it('submits text', () => {
    const handler = vi.fn();
    render(<Composer onSubmit={handler} />);
    const textarea = screen.getByPlaceholderText('Send a message (Shift+Enter for newline)');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.submit(textarea.closest('form')!);
    expect(handler).toHaveBeenCalledWith('Hello');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Composer onSubmit={() => undefined} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
