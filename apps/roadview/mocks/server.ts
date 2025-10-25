import { NextRequest, NextResponse } from 'next/server';
import data from './fixtures/results.json';
import { searchResultSchema, SearchResult, searchResponseSchema } from '../lib/schema';

const FIXTURE_RESULTS: SearchResult[] = searchResultSchema.array().parse(data.results);

function filterByQuery(query: string): SearchResult[] {
  if (!query) {
    return FIXTURE_RESULTS;
  }
  const normalized = query.toLowerCase();
  return FIXTURE_RESULTS.filter((result) => {
    return (
      result.title.toLowerCase().includes(normalized) ||
      result.snippet.toLowerCase().includes(normalized) ||
      result.domain.toLowerCase().includes(normalized)
    );
  });
}

function computeFacets(results: SearchResult[]) {
  const sourceType: Record<string, number> = {};
  const bias: Record<string, number> = {};
  const domains: Record<string, number> = {};

  results.forEach((result) => {
    sourceType[result.sourceType] = (sourceType[result.sourceType] ?? 0) + 1;
    bias[result.bias] = (bias[result.bias] ?? 0) + 1;
    domains[result.domain] = (domains[result.domain] ?? 0) + 1;
  });

  return { sourceType, bias, domains };
}

export function buildSearchPayload(query: string) {
  const filtered = filterByQuery(query);
  return searchResponseSchema.parse({
    results: filtered,
    facets: computeFacets(filtered)
  });
}

export async function handleSearchRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const payload = buildSearchPayload(query);
  return NextResponse.json(payload);
}
