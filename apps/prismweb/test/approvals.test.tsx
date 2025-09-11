import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Approvals from '../src/components/prism/Approvals.tsx';

describe('Approvals component', () => {
  it('calls approve handler', () => {
    const approve = vi.fn();
    const deny = vi.fn();
    const approvals = [{ id: '1', capability: 'write', status: 'pending', payload: [], createdAt: '' }];
    const { getByText } = render(<Approvals approvals={approvals as any} client={{ approve, deny }} />);
    fireEvent.click(getByText('Approve'));
    expect(approve).toHaveBeenCalledWith('1');
  });
});
