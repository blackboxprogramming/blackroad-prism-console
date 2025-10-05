import { FeeSpec } from "@lucidia/core";
import { z } from "zod";
import { PolicyViolation } from "./types.js";

const CapInput = z.object({
  effectiveBps: z.number().nonnegative(),
  scheduleSpec: z.custom<FeeSpec>(),
});

export function enforceFeeCap(input: {
  effectiveBps: number;
  scheduleSpec: FeeSpec;
}): PolicyViolation | null {
  const parsed = CapInput.parse(input);
  if (parsed.scheduleSpec.capBps === undefined || parsed.scheduleSpec.capBps === null) {
    return null;
  }
  if (parsed.effectiveBps <= parsed.scheduleSpec.capBps) {
    return null;
  }
  return {
    code: "CAP_EXCEEDED",
    severity: 90,
    message: `Effective rate ${parsed.effectiveBps}bps exceeds cap ${parsed.scheduleSpec.capBps}bps`,
    details: {
      effectiveBps: parsed.effectiveBps,
      capBps: parsed.scheduleSpec.capBps,
    },
  };
}

