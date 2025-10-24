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
