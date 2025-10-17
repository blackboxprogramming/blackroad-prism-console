import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Console from '../src/components/prism/Console.tsx';

class MockEventSource {
  static last: MockEventSource | null = null;
  listeners: Record<string, Function[]> = {};
  constructor(url: string) { MockEventSource.last = this; }
  addEventListener(type: string, cb: any) { (this.listeners[type] ||= []).push(cb); }
  emit(type: string, data: any) {
    const envelope = {
      id: 'evt',
      kind: type,
      data,
      index: 0,
      ts: new Date().toISOString(),
      prevHash: 'GENESIS',
      hash: 'hash',
    };
    (this.listeners[type] || []).forEach((cb) => cb({ data: JSON.stringify(envelope) }));
  }
  close() {}
}
(globalThis as any).EventSource = MockEventSource as any;

describe('Console component', () => {
  it('shows run output and status', async () => {
    const client = {
      run: async () => ({ runId: '1' }),
      cancelRun: async () => {},
    };
    const { getByText, getByRole } = render(<Console client={client} />);
    fireEvent.change(getByRole('textbox'), { target: { value: 'echo' } });
    fireEvent.click(getByText('Run'));
    await new Promise((r) => setTimeout(r, 0));
    MockEventSource.last?.emit('run.out', { runId: '1', chunk: 'hello\n' });
    MockEventSource.last?.emit('run.end', { runId: '1', exitCode: 0 });
    await new Promise((r) => setTimeout(r, 0));
    expect(getByText(/hello/)).toBeTruthy();
    expect(getByText('ok')).toBeTruthy();
  });
});
