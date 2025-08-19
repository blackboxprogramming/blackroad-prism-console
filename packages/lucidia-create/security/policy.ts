export interface Policy {
  maxNodes: number;
  maxEdges: number;
  maxQueue: number;
  maxTickMs: number;
}

export const defaultPolicy: Policy = {
  maxNodes: 256,
  maxEdges: 1024,
  maxQueue: 1024,
  maxTickMs: 10
};

export function enforceGraphPolicy(graph: {nodes: unknown[]; edges: unknown[]}, policy: Policy = defaultPolicy) {
  if (graph.nodes.length > policy.maxNodes) {
    throw new Error(`graph exceeds maxNodes: ${graph.nodes.length}`);
  }
  if (graph.edges.length > policy.maxEdges) {
    throw new Error(`graph exceeds maxEdges: ${graph.edges.length}`);
  }
}

export function forbidFunctions(obj: unknown) {
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (typeof cur === 'function' || cur instanceof RegExp) {
      throw new Error('Functions and RegExp are not allowed in schematics');
    }
    if (typeof cur === 'object') {
      for (const v of Object.values(cur)) stack.push(v as unknown);
    }
  }
}
