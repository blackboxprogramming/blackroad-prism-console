import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostComposer } from '@/components/post-composer';
import { ReactNode } from 'react';

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('PostComposer accessibility', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('has no axe violations by default', async () => {
    const { container } = renderWithClient(<PostComposer threadId="thread-1" />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
