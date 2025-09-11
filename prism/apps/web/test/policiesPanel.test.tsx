import { render, screen, fireEvent } from '@testing-library/react';
import PoliciesPanel from '../src/PoliciesPanel';
import { vi, test, expect } from 'vitest';

let currentMode = 'dev';

global.fetch = vi.fn((url: any, opts: any) => {
  if (!opts || opts.method === undefined || opts.method === 'GET') {
    return Promise.resolve({ json: () => Promise.resolve({ currentMode }) });
  }
  const body = JSON.parse(opts.body);
  currentMode = body.mode;
  return Promise.resolve({ json: () => Promise.resolve({ currentMode }) });
}) as any;

test('changes mode', async () => {
  render(<PoliciesPanel />);
  fireEvent.change(await screen.findByDisplayValue('Dev'), { target: { value: 'trusted' } });
  expect(fetch).toHaveBeenCalledWith('/mode', expect.objectContaining({ method: 'PUT' }));
});
