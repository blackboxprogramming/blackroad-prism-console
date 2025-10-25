import { describe, expect, it } from 'vitest';
import { searchResponseSchema } from '../lib/schema';
import fixture from '../mocks/fixtures/results.json';

describe('search response contract', () => {
  it('throws when credScore is missing', () => {
    const invalid = {
      results: fixture.results.map((result) => {
        const { credScore, ...rest } = result;
        return rest;
      }),
      facets: {
        sourceType: {},
        bias: {},
        domains: {}
      }
    };

    expect(() => searchResponseSchema.parse(invalid)).toThrowError(/credScore/);
  });

  it('throws when confidence is out of range', () => {
    const invalid = {
      results: fixture.results.map((result, index) =>
        index === 0
          ? {
              ...result,
              confidence: 2
            }
          : result
      ),
      facets: {
        sourceType: {},
        bias: {},
        domains: {}
      }
    };

    expect(() => searchResponseSchema.parse(invalid)).toThrowError(/confidence/);
  });
});
