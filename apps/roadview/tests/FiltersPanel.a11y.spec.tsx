import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FiltersPanel } from '../components/FiltersPanel';

const mockFacets = {
  sourceType: {
    news: 5,
    gov: 3
  },
  bias: {
    left: 2,
    center: 4,
    na: 1
  },
  domains: {
    'example.com': 3
  }
};

describe('FiltersPanel accessibility', () => {
  it('meets axe accessibility rules', async () => {
    const { container } = render(
      <FiltersPanel
        facets={mockFacets}
        selectedSourceTypes={new Set()}
        selectedBiases={new Set()}
        minCredScore={null}
        dateRange={{}}
        onToggleSourceType={() => {}}
        onToggleBias={() => {}}
        onMinCredScoreChange={() => {}}
        onDateRangeChange={() => {}}
        onReset={() => {}}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
