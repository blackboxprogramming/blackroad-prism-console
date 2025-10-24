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

