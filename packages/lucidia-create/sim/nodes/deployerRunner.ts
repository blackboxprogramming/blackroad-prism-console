import { NodeHandler } from "../engine.js";

export const deployerRunner: NodeHandler = (_node, inputs) => {
  const incoming = inputs.in || [];
  return { outputs: { out: incoming.map(() => ({ status: "ok" })) } };
};
