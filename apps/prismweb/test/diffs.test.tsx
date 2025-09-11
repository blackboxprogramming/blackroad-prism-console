import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Diffs from '../src/components/prism/Diffs.tsx';

describe('Diffs component', () => {
  it('calls apply with selected hunks', () => {
    const diffs = [{ path: 'a.txt', hunks: [{ lines: ['one'] }, { lines: ['two'] }] }];
    const onApply = vi.fn();
    const { getAllByRole, getByText } = render(<Diffs diffs={diffs as any} onApply={onApply} />);
    const boxes = getAllByRole('checkbox');
    fireEvent.click(boxes[1]);
    fireEvent.click(getByText('Apply'));
    expect(onApply).toHaveBeenCalled();
    const arg = onApply.mock.calls[0][0][0];
    expect(arg.hunks.length).toBe(1);
    expect(arg.hunks[0].lines[0]).toBe('two');
  });
});
