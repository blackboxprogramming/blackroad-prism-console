import { describe, expect, it, vi } from 'vitest';
import { createAuthClient } from '../src/index.js';

const baseURL = 'https://auth.test';

function createFetchMock(response: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response
  });
}

describe('Auth SDK', () => {
  it('performs signup', async () => {
    const fetchMock = createFetchMock({ user: { id: '1', email: 'user@example.com', createdAt: '2024-01-01' } });
    const client = createAuthClient({ baseURL, fetchImpl: fetchMock as any });
    const response = await client.signup({ email: 'user@example.com', password: 'password' });
    expect(response.user.email).toBe('user@example.com');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('throws on non-200 response', async () => {
    const fetchMock = createFetchMock({}, 500);
    const client = createAuthClient({ baseURL, fetchImpl: fetchMock as any });
    await expect(client.login({ email: 'user@example.com', password: 'password' })).rejects.toThrow();
  });
});
