import { NodeHandler } from "../engine.js";

export const meter: NodeHandler = (node, inputs) => {
  const incoming = inputs.in || [];
  let count = (node.state?.count as number) ?? 0;
  count += incoming.length;
  return { state: { count }, outputs: { out: incoming } };
};
