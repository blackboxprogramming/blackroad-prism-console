export type Role = 'viewer' | 'operator' | 'admin';

export interface RequestContext {
  role: Role;
  redacted?: boolean;
}

export function assertRole(ctx: RequestContext, required: Role): void {
  const hierarchy: Role[] = ['viewer', 'operator', 'admin'];
  const currentIdx = hierarchy.indexOf(ctx.role);
  const requiredIdx = hierarchy.indexOf(required);
  if (currentIdx < requiredIdx) {
    throw new Error(`RBAC: role ${ctx.role} cannot perform action requiring ${required}`);
  }
}

export function redactIfNeeded<T extends Record<string, unknown>>(ctx: RequestContext, payload: T): T {
  if (ctx.redacted) {
    return { ...payload, artifacts: [] } as T;
  }
  return payload;
}
