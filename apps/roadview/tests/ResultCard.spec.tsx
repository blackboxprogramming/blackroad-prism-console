import { render, screen, fireEvent } from '@testing-library/react';
import { ResultCard } from '../components/ResultCard';
import { SearchResult } from '../lib/schema';

const mockResult: SearchResult = {
  id: 'example',
  title: 'Example result',
  snippet: 'A description of the result snippet.',
  url: 'https://example.com',
  domain: 'example.com',
  sourceType: 'news',
  bias: 'center',
  credScore: 82,
  publishedAt: '2024-01-01T00:00:00.000Z',
  confidence: 0.9
};

describe('ResultCard', () => {
  it('renders search result details', () => {
    render(<ResultCard result={mockResult} />);

    expect(screen.getByRole('heading', { name: /example result/i })).toBeInTheDocument();
    expect(screen.getByText(/description of the result snippet/i)).toBeInTheDocument();
    expect(screen.getByText(mockResult.domain)).toBeInTheDocument();
    expect(screen.getByText(/Credibility\s+82\/100/i)).toBeInTheDocument();
  });

  it('expands transparency panel on click', () => {
    render(<ResultCard result={mockResult} />);

    const toggle = screen.getByRole('button', { name: /source transparency/i });
    fireEvent.click(toggle);

    expect(screen.getByText(/bias tag/i)).toBeVisible();
  });
});
