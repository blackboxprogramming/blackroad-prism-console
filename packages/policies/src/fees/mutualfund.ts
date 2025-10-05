import { FeeSchedule } from "@lucidia/core";
import { z } from "zod";
import { PolicyViolation } from "./types.js";

const CreditInput = z.object({
  schedule: z.custom<FeeSchedule>(),
  mode: z.enum(["FEE_CREDIT", "REBATE"]),
  amount: z.number().positive(),
});

export function validateMutualFundCredit(input: {
  schedule: FeeSchedule;
  mode: "FEE_CREDIT" | "REBATE";
  amount: number;
}): PolicyViolation | null {
  const parsed = CreditInput.parse(input);
  if (parsed.mode === "REBATE") {
    return {
      code: "MF_COMMISSION_REBATE",
      severity: 90,
      message: "Mutual-fund commission rebates are prohibited",
      details: { scheduleId: parsed.schedule.id },
    };
  }
  if (!parsed.schedule.spec.allowFeeCreditsFromMF) {
    return {
      code: "MF_COMMISSION_REBATE",
      severity: 70,
      message: "Schedule does not permit mutual-fund fee credits",
      details: { scheduleId: parsed.schedule.id },
    };
  }
  return null;
}

