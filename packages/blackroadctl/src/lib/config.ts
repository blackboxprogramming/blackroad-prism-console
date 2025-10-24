export interface CliConfig {
  endpoint: string;
  token?: string;
  devToken?: string;
  role: 'deployer' | 'operator' | 'viewer';
  economyEndpoint: string;
  economyToken?: string;
  economyDevToken?: string;
}

export function loadConfig(): CliConfig {
  const endpoint = process.env.CONTROL_PLANE_ENDPOINT ?? 'http://localhost:4100/graphql';
  const token = process.env.CONTROL_PLANE_TOKEN;
  const devToken = process.env.LOCAL_DEV_TOKEN ?? process.env.BLACKROAD_DEV_TOKEN;
  const economyEndpoint = process.env.ECONOMY_GATEWAY_ENDPOINT ?? 'http://localhost:4600/graphql';
  const economyToken = process.env.ECONOMY_GATEWAY_TOKEN ?? token;
  const economyDevToken = process.env.ECONOMY_DEV_TOKEN ?? devToken;
  const roleEnv = (process.env.BLACKROADCTL_ROLE ?? 'deployer').toLowerCase();

  const allowedRoles = new Set(['deployer', 'operator', 'viewer']);
  if (!allowedRoles.has(roleEnv)) {
    throw new Error(`Unknown role '${roleEnv}' — expected deployer, operator, or viewer`);
  }

  return {
    endpoint,
    token,
    devToken,
    role: roleEnv as CliConfig['role'],
    economyEndpoint,
    economyToken,
    economyDevToken
  };
}
