import { NodeHandler } from "../engine.js";

export const belt: NodeHandler = (node, inputs) => {
  const capacity = (node.cfg.capacity as number) ?? 1;
  const queue: unknown[] = Array.isArray(node.state?.queue)
    ? (node.state!.queue as unknown[])
    : [];
  for (const v of inputs.in || []) {
    if (queue.length < capacity) queue.push(v);
  }
  const out = queue.length > 0 ? [queue.shift()!] : [];
  return { state: { queue }, outputs: { out } };
};
