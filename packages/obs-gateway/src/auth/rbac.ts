export type Role = 'viewer' | 'operator' | 'admin';

export interface AccessRequest {
  role: Role;
  scopes: string[];
}

export type Operation = 'events:read' | 'correlate:read';

const ROLE_SCOPES: Record<Role, Operation[]> = {
  viewer: ['events:read'],
  operator: ['events:read', 'correlate:read'],
  admin: ['events:read', 'correlate:read'],
};

export function authorize(request: AccessRequest, operation: Operation): boolean {
  const scopes = new Set([...(request.scopes ?? []), ...ROLE_SCOPES[request.role]]);
  return scopes.has(operation);
}

export interface Principal {
  id: string;
  role: Role;
}

export function canRead(principal: Principal | null): boolean {
  return Boolean(principal);
}

export function canPost(principal: Principal | null): boolean {
  if (!principal) return false;
  return principal.role === 'operator' || principal.role === 'admin';
}

export function canRedact(principal: Principal | null): boolean {
  if (!principal) return false;
  return principal.role === 'admin';
}

export function assertCanRead(principal: Principal | null): void {
  if (!canRead(principal)) {
    throw new Error('forbidden: viewer role required');
  }
}

export function assertCanPost(principal: Principal | null): void {
  if (!canPost(principal)) {
    throw new Error('forbidden: operator role required');
  }
}

export function assertCanRedact(principal: Principal | null): void {
  if (!canRedact(principal)) {
    throw new Error('forbidden: admin role required');
  }
}
