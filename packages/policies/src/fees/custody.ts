import { AccountFeePlan, CustodyAuthorization } from "@lucidia/core";
import { z } from "zod";
import { PolicyViolation } from "./types.js";

const CustodyInput = z.object({
  plan: z.custom<AccountFeePlan>(),
  authorization: z.custom<CustodyAuthorization | null | undefined>(),
});

export function requireCustodyAuthorization(input: {
  plan: AccountFeePlan;
  authorization?: CustodyAuthorization | null;
}): PolicyViolation | null {
  const { plan, authorization } = CustodyInput.parse(input);
  if (!plan.custodyDeductionAllowed) {
    return {
      code: "NO_AUTH",
      severity: 80,
      message: "Custody deduction requested without client authorization",
      details: { planId: plan.id },
    };
  }
  if (!authorization || !authorization.granted) {
    return {
      code: "NO_AUTH",
      severity: 85,
      message: "Custody deduction authorization artifact missing",
      details: { planId: plan.id },
    };
  }
  return null;
}

