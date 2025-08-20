import { NodeHandler } from "../engine.js";

export const depot: NodeHandler = (node, inputs) => {
  const incoming = inputs.in || [];
  const store: unknown[] = Array.isArray(node.state?.store)
    ? (node.state!.store as unknown[])
    : [];
  store.push(...incoming);
  return { state: { store }, outputs: {} };
};
