import { describe, expect, it } from 'vitest';
import { threadsResponseSchema } from '@/lib/schemas';
import { readFixture } from '@/mocks/utils';
import type { ThreadsResponse } from '@/lib/types';

describe('contract fixtures', () => {
  it('parse threads fixture successfully', () => {
    const data = readFixture<ThreadsResponse>('threads.json');
    const result = threadsResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects drift when tags missing', () => {
    const data = readFixture<ThreadsResponse>('threads.json');
    // simulate drift by removing tags array
    const mutated = { threads: data.threads.map(({ tags, ...rest }) => rest) };
    const result = threadsResponseSchema.safeParse(mutated);
    expect(result.success).toBe(false);
  });
});
