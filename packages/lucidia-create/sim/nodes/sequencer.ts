import { NodeHandler } from "../engine.js";

export const sequencer: NodeHandler = (node, inputs) => {
  const period = (node.cfg.period as number) ?? 1;
  let tick = (node.state?.tick as number) ?? 0;
  tick++;
  const outputs: Record<string, unknown[]> | undefined =
    tick % period === 0 ? { out: inputs.in || [] } : undefined;
  return { state: { tick }, outputs };
};
