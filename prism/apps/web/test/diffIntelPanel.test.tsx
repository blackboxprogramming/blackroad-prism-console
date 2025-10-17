import { render, screen, fireEvent } from '@testing-library/react';
import DiffIntelPanel from '../src/DiffIntelPanel';
import { vi, test, expect } from 'vitest';

global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;

test('renders intel and runs tests', () => {
  render(<DiffIntelPanel intel={[{ path: 'a.js', summary: 's', testsPredicted: [{ file: 'a.test.js', weight: 1 }] }]} />);
  expect(screen.getByText(/a\.test\.js/)).toBeTruthy();
  fireEvent.click(screen.getByText('Run predicted tests'));
  expect(fetch).toHaveBeenCalledWith('/run', expect.anything());
});
