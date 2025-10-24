export type Role = 'operator' | 'viewer';

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new Error(`Role ${role} is not permitted for this operation`);
  }
}
