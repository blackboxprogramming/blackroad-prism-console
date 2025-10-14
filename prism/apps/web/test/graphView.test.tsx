import { render, screen } from '@testing-library/react';
import GraphView from '../src/GraphView';
import { vi, test, expect } from 'vitest';

class MockES {
  onmessage: any = null;
  constructor(url: string) { MockES.instance = this; }
  close() {}
  static instance: any;
}
(global as any).EventSource = MockES as any;

global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ nodes: [{ id: 'n1' }], edges: [] }) })) as any;

test('updates on sse', async () => {
  render(<GraphView />);
  expect(await screen.findByText('n1')).toBeTruthy();
  MockES.instance.onmessage({ data: JSON.stringify({ type: 'node', op: 'upsert', data: { id: 'n2' } }) });
  expect(await screen.findByText('n2')).toBeTruthy();
});
