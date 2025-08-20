export type Tri = -1 | 0 | 1;
export type NodeId = string;
export type PortId = string;

export interface Node {
  id: NodeId;
  type: string;
  cfg: Record<string, unknown>;
  state?: Record<string, unknown>;
}

export interface Edge {
  from: { node: NodeId; port: PortId };
  to: { node: NodeId; port: PortId };
}

export interface TickResult {
  emitted: Array<{ to: { node: NodeId; port: PortId }; value: unknown }>;
  contradictions: Array<{ node: NodeId; code: string; detail?: string }>;
}

export type NodeHandler = (
  node: Node,
  inputs: Record<PortId, unknown[]>
) => {
  state?: Record<string, unknown>;
  outputs?: Record<PortId, unknown[]>;
  contradictions?: Array<{ code: string; detail?: string }>;
};

export class Engine {
  private nodeMap = new Map<NodeId, Node>();
  private adjacency = new Map<NodeId, Array<Edge>>();
  private inbox = new Map<NodeId, Record<PortId, unknown[]>>();
  constructor(
    private nodes: Node[],
    private edges: Edge[],
    private handlers: Record<string, NodeHandler>
  ) {
    for (const n of nodes) this.nodeMap.set(n.id, n);
    for (const e of edges) {
      if (!this.adjacency.has(e.from.node)) this.adjacency.set(e.from.node, []);
      this.adjacency.get(e.from.node)!.push(e);
    }
  }

  deliver(node: NodeId, port: PortId, value: unknown) {
    if (!this.inbox.has(node)) this.inbox.set(node, {});
    const ports = this.inbox.get(node)!;
    if (!ports[port]) ports[port] = [];
    ports[port].push(value);
  }

  tick(): TickResult {
    const res: TickResult = { emitted: [], contradictions: [] };
    for (const node of this.nodes) {
      const handler = this.handlers[node.type];
      if (!handler) continue;
      const inputs = this.inbox.get(node.id) || {};
      this.inbox.set(node.id, {});
      const { state, outputs, contradictions } = handler(node, inputs);
      if (state) node.state = state;
      if (contradictions) {
        for (const c of contradictions) {
          res.contradictions.push({ node: node.id, code: c.code, detail: c.detail });
        }
      }
      if (outputs) {
        for (const [port, values] of Object.entries(outputs)) {
          const edges = (this.adjacency.get(node.id) || []).filter(
            (e) => e.from.port === port
          );
          for (const edge of edges) {
            for (const v of values) {
              res.emitted.push({ to: edge.to, value: v });
              this.deliver(edge.to.node, edge.to.port, v);
            }
          }
        }
      }
    }
    return res;
  }
}
