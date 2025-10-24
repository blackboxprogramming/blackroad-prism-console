import { Principal } from '../store';

export interface AuthResult {
  principal: Principal;
}

export function authenticate(headers: Record<string, string | undefined>): AuthResult {
  const devToken = process.env.LOCAL_DEV_TOKEN;
  const providedDevToken = headers['x-dev-token'];
  if (devToken && providedDevToken && providedDevToken === devToken) {
    return { principal: { id: 'dev-token', roles: ['deployer', 'operator', 'viewer'] } };
  }

  const authHeader = headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const [roleList, subject] = token.split(':');
    const roles = roleList ? roleList.split(',') : ['viewer'];
    return { principal: { id: subject ?? 'oidc-user', roles } };
  }

  throw new Error('Unauthorized');
}

export function assertRole(principal: Principal, required: string) {
  if (!principal.roles.includes(required)) {
    throw new Error(`Forbidden: missing role ${required}`);
  }
}
