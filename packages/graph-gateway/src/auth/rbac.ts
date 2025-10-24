const ROLE_ORDER = ['viewer', 'operator', 'admin'] as const;

type Role = (typeof ROLE_ORDER)[number];

export function ensureRole(actual: string | undefined, required: Role): void {
  const actualIdx = ROLE_ORDER.indexOf((actual as Role) ?? 'viewer');
  const requiredIdx = ROLE_ORDER.indexOf(required);
  if (actualIdx < requiredIdx) {
    throw new Error(`role ${actual ?? 'unknown'} lacks permission for ${required}`);
interface Context {
  role: 'viewer' | 'operator' | 'admin';
}

export function createContext(): Context {
  const role = (process.env.GRAPH_GATEWAY_ROLE as Context['role']) ?? 'operator';
  return { role };
}

export function assertRole(context: Context, required: Context['role']) {
  const order: Context['role'][] = ['viewer', 'operator', 'admin'];
  if (order.indexOf(context.role) < order.indexOf(required)) {
    throw new Error(`role ${context.role} cannot execute this mutation`);
  }
}
