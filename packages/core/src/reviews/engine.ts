import type { ComplianceDb, CreateEvidenceInput, ReviewOutcome } from "@blackroad/compliance-db";
import { appendWorm } from "@blackroad/compliance-archival";
import { evaluatePolicy, getEvaluator } from "../policies/index.js";
import type { EvalInput, EvalResult } from "../types.js";

export interface ArtifactInput extends CreateEvidenceInput {
  role: "Input" | "Output" | "Approval" | "Disclosure";
}

export interface ReviewRunOptions<T = unknown> {
  db: ComplianceDb;
  policyKeys: string[];
  reviewType: string;
  evalInput: EvalInput<T>;
  reviewerId?: string;
  artifacts?: ArtifactInput[];
}

const determineOutcome = (result: EvalResult): ReviewOutcome => {
  if (result.pass) {
    return result.riskScore <= 35 ? "AutoApproved" : "Approved";
  }
  if (result.breaches.includes("ads.cta_blocked")) {
    return "Rejected";
  }
  return result.riskScore > 75 ? "Escalated" : "NeedsChanges";
};

export const runPolicyReview = async <T>(options: ReviewRunOptions<T>) => {
  const { db, policyKeys, reviewType, evalInput, reviewerId } = options;
  const policyResults: EvalResult[] = policyKeys.map((key) => {
    const evaluator = getEvaluator(key);
    return evaluatePolicy(evaluator.key, evalInput);
  });

  const aggregate: EvalResult = policyResults.reduce(
    (acc, result) => ({
      pass: acc.pass && result.pass,
      riskScore: Math.max(acc.riskScore, result.riskScore),
      breaches: [...acc.breaches, ...result.breaches],
      requiredDisclosures: Array.from(new Set([...(acc.requiredDisclosures ?? []), ...(result.requiredDisclosures ?? [])])),
      requiredEvidence: Array.from(new Set([...(acc.requiredEvidence ?? []), ...(result.requiredEvidence ?? [])])),
      gateRecommendation: result.gateRecommendation ?? acc.gateRecommendation,
    }),
    {
      pass: true,
      riskScore: 0,
      breaches: [],
    }
  );

  aggregate.breaches.sort();
  const outcome = determineOutcome(aggregate);

  const reviewRecord = await db.review.create({
    type: reviewType,
    input: evalInput,
    outcome,
    riskScore: aggregate.riskScore,
    breaches: aggregate.breaches,
    reviewerId,
  });

  for (const artifact of options.artifacts ?? []) {
    const evidence = await db.evidence.create(artifact);
    await db.reviewArtifact.link({
      reviewId: reviewRecord.id,
      evidenceId: evidence.id,
      role: artifact.role,
    });
  }

  await appendWorm({
    db,
    payload: {
      type: "review",
      reviewId: reviewRecord.id,
      reviewType,
      outcome,
      riskScore: aggregate.riskScore,
      breaches: aggregate.breaches,
    },
  });

  return {
    review: reviewRecord,
    outcome,
    aggregate,
  };
};
