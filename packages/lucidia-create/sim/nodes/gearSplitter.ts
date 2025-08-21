import { NodeHandler } from "../engine.js";

export const gearSplitter: NodeHandler = (_node, inputs) => {
  const incoming = inputs.in || [];
  return { outputs: { a: incoming, b: incoming } };
};
