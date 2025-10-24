import EconomyClient from '../src/client';

describe('EconomyClient', () => {
  it('constructs request headers with tokens', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { simulation: null } })
    });

    const client = new EconomyClient({
      endpoint: 'http://localhost/graphql',
      token: 'token',
      devToken: 'dev',
      fetchImpl: fetchImpl as unknown as typeof fetch
    });

    await client.getSimulation('abc');

    expect(fetchImpl).toHaveBeenCalledWith('http://localhost/graphql', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer token',
        'X-Dev-Token': 'dev'
      })
    }));
  });
});
