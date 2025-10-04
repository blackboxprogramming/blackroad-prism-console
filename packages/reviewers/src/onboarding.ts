import type { ComplianceDb } from "@blackroad/compliance-db";
import {
  onboardingU4ChangesEvaluator,
  runPolicyReview,
  type EvalInput,
  type U4ChangeEvent,
} from "@blackroad/compliance-core";

type EvalCtx = EvalInput<unknown>["context"];

export const runReview = async (db: ComplianceDb, data: U4ChangeEvent, context: EvalCtx = {}) => {
  const evalInput: EvalInput<U4ChangeEvent> = {
    subject: "employee",
    data,
    context,
  };

  return runPolicyReview({
    db,
    policyKeys: [onboardingU4ChangesEvaluator.key],
    reviewType: "onboarding",
    evalInput,
  });
};
