export type Role = 'viewer' | 'editor' | 'admin';

const permissions: Record<Role, string[]> = {
  viewer: ['caption:read'],
  editor: ['caption:read', 'caption:write'],
  admin: ['caption:read', 'caption:write']
};

export function assertCaptionPermission(role: Role, permission: 'caption:read' | 'caption:write') {
  const allowed = permissions[role];
  if (!allowed.includes(permission)) {
    throw new Error(`Role ${role} is not permitted to perform ${permission}`);
  }
}
