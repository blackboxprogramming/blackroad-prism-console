import { AccountFeePlan, FeeSchedule } from "@lucidia/core";
import { z } from "zod";
import { PolicyViolation } from "./types.js";

const EligibilityInput = z.object({
  plan: z.custom<AccountFeePlan>(),
  schedule: z.custom<FeeSchedule>(),
  eligibility: z
    .object({
      qualifiedPurchaser: z.boolean().optional(),
      qualifiedClient: z.boolean().optional(),
    })
    .optional(),
});

export function enforcePerformanceEligibility(input: {
  plan: AccountFeePlan;
  schedule: FeeSchedule;
  eligibility?: { qualifiedPurchaser?: boolean; qualifiedClient?: boolean };
}): PolicyViolation | null {
  const { plan, schedule, eligibility } = EligibilityInput.parse(input);
  if (!schedule.spec.performance) {
    return null;
  }
  if (!plan.performanceFeeAllowed) {
    return {
      code: "PERF_NOT_ELIGIBLE",
      severity: 95,
      message: "Performance fee blocked because plan is not eligible",
      details: { planId: plan.id },
    };
  }
  if (!eligibility) {
    return {
      code: "PERF_NOT_ELIGIBLE",
      severity: 95,
      message: "Performance fee eligibility evidence missing",
      details: { planId: plan.id },
    };
  }
  if (!eligibility.qualifiedClient && !eligibility.qualifiedPurchaser) {
    return {
      code: "PERF_NOT_ELIGIBLE",
      severity: 95,
      message: "Client fails qualified purchaser/client requirements",
      details: { planId: plan.id },
    };
  }
  return null;
}

