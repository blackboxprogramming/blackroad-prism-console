import { NodeHandler } from "../engine.js";

export const gearRatio: NodeHandler = (node, inputs) => {
  const ratio = (node.cfg.ratio as number) ?? 1;
  let counter = (node.state?.counter as number) ?? 0;
  counter++;
  const outputs: Record<string, unknown[]> | undefined =
    counter % ratio === 0 ? { out: inputs.in || [] } : undefined;
  return { state: { counter }, outputs };
};
