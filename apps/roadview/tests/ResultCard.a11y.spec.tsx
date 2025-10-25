import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ResultCard } from '../components/ResultCard';
import { SearchResult } from '../lib/schema';

const mockResult: SearchResult = {
  id: 'a11y',
  title: 'Accessible result',
  snippet: 'Accessibility test snippet for the result card component.',
  url: 'https://example.com/a11y',
  domain: 'example.com',
  sourceType: 'journal',
  bias: 'center',
  credScore: 75,
  publishedAt: '2024-01-01T00:00:00.000Z',
  confidence: 0.8
};

describe('ResultCard accessibility', () => {
  it('has no detectable accessibility violations', async () => {
    const { container } = render(<ResultCard result={mockResult} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
