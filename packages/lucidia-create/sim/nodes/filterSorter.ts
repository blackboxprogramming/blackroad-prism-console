import { NodeHandler } from "../engine.js";

export const filterSorter: NodeHandler = (node, inputs) => {
  const match = (node.cfg as any).match;
  const incoming = inputs.in || [];
  const pass: unknown[] = [];
  const fail: unknown[] = [];
  for (const v of incoming) {
    if (v === match) pass.push(v);
    else fail.push(v);
  }
  return { outputs: { pass, fail } };
};
