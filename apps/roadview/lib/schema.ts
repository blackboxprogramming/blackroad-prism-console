import { z } from 'zod';

export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  url: z.string().url(),
  domain: z.string(),
  sourceType: z.enum(['journal', 'news', 'blog', 'paper', 'gov', 'repo']),
  bias: z.enum(['left', 'center', 'right', 'na']),
  credScore: z.number().min(0).max(100),
  publishedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid ISO date'
  }),
  confidence: z.number().min(0).max(1)
});

export const searchFacetsSchema = z.object({
  sourceType: z.record(z.string(), z.number()),
  bias: z.record(z.string(), z.number()),
  domains: z.record(z.string(), z.number())
});

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  facets: searchFacetsSchema
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type SearchFacets = z.infer<typeof searchFacetsSchema>;
