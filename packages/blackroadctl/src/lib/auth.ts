import { CliConfig } from './config';

type CommandCapability = 'deploy:create' | 'deploy:promote' | 'ops:status' | 'ops:incidents';

type RoleMatrix = Record<CliConfig['role'], CommandCapability[]>;

const roleCapabilities: RoleMatrix = {
  deployer: ['deploy:create', 'deploy:promote', 'ops:status', 'ops:incidents'],
  operator: ['ops:status', 'ops:incidents'],
  viewer: ['ops:status']
};

export function assertCapability(config: CliConfig, capability: CommandCapability) {
  const allowed = roleCapabilities[config.role];
  if (!allowed.includes(capability)) {
    throw new Error(`Role '${config.role}' is not permitted to run ${capability}`);
  }
}

export function authHeaders(config: CliConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  if (config.devToken) {
    headers['X-Dev-Token'] = config.devToken;
  }
  return headers;
}
