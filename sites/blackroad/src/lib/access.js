const ADMIN_LIKE_ROLES = ['admin', 'dev', 'owner']

export function isAdminLikeRole(role) {
  return typeof role === 'string' && ADMIN_LIKE_ROLES.includes(role)
}
