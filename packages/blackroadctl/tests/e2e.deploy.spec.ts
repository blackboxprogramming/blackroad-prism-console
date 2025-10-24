/// <reference types="jest" />
import ControlPlaneClient from '@blackroad/control-plane-sdk';
import { runDeployCreate } from '../src/commands/deploy/create';

jest.mock('@blackroad/control-plane-sdk');

describe('blackroadctl deploy create', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.CONTROL_PLANE_ENDPOINT = 'http://localhost/graphql';
    process.env.LOCAL_DEV_TOKEN = 'test-token';
    process.env.BLACKROADCTL_ROLE = 'deployer';
  });

  it('prints audit event metadata', async () => {
    const deployCreate = jest.fn().mockResolvedValue({
      audit: {
        ts: '2024-01-01T00:00:00Z',
        actor: 'alice',
        action: 'deploy.create',
        subjectType: 'Release',
        subjectId: 'rel-1',
        metadata: { serviceId: 'svc-demo' }
      }
    });

    (ControlPlaneClient as unknown as jest.Mock).mockImplementation(() => ({ deployCreate }));

    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await runDeployCreate({
      serviceId: 'svc-demo',
      envId: 'staging',
      sha: 'abc123',
      telemetry: { span: { finish: jest.fn() } }
    });

    expect(deployCreate).toHaveBeenCalledWith({ serviceId: 'svc-demo', envId: 'staging', sha: 'abc123' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('deploy.create by alice'));
  });
});
