import { NodeHandler } from "../engine.js";

export const clutchGate: NodeHandler = (node, inputs) => {
  const stateVal = node.cfg.state as number;
  if (stateVal === -1) {
    return { contradictions: [{ code: "gate-negative", detail: "state -1" }] };
  }
  if (stateVal === 1) {
    return { outputs: { out: inputs.in || [] } };
  }
  const outputs: Record<string, unknown[]> = {};
  return { outputs };
};
