import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChatPane } from '../../src/ui/components/Chat/ChatPane';

expect.extend(toHaveNoViolations);

describe('ChatPane', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ChatPane />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
