import { ControlPlaneClient } from '../src/client';

describe('ControlPlaneClient', () => {
  it('propagates GraphQL errors', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: 'boom' }] })
    });

    const client = new ControlPlaneClient({ endpoint: 'http://example/graphql', fetchImpl });
    await expect(client.recentIncidents('svc-demo')).rejects.toThrow('boom');
  });
});
