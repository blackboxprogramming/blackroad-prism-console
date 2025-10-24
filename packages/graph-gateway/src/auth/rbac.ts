const ROLE_ORDER = ['viewer', 'operator', 'admin'] as const;

type Role = (typeof ROLE_ORDER)[number];

export function ensureRole(actual: string | undefined, required: Role): void {
  const actualIdx = ROLE_ORDER.indexOf((actual as Role) ?? 'viewer');
  const requiredIdx = ROLE_ORDER.indexOf(required);
  if (actualIdx < requiredIdx) {
    throw new Error(`role ${actual ?? 'unknown'} lacks permission for ${required}`);
  }
}
