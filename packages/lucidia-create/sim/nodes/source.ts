import { NodeHandler } from "../engine.js";

export const source: NodeHandler = (node) => {
  const count = (node.state?.count as number) ?? 0;
  const value = node.cfg.value ?? count;
  return {
    state: { count: count + 1 },
    outputs: { out: [value] }
  };
};
