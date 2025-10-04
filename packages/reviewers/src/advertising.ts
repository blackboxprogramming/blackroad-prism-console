import { createHash } from "crypto";
import type { ComplianceDb } from "@blackroad/compliance-db";
import {
  adsMarketingRuleEvaluator,
  runPolicyReview,
  type EvalInput,
  type AdvertisingPayload,
} from "@blackroad/compliance-core";

export interface AdvertisingReviewInput extends AdvertisingPayload {
  content: string;
}

const hashContent = (content: string) =>
  createHash("sha256").update(content).digest("hex");

export const runReview = async (db: ComplianceDb, input: AdvertisingReviewInput) => {
  const evalInput: EvalInput<AdvertisingPayload> = {
    subject: "communication",
    data: {
      title: input.title,
      contentUrl: input.contentUrl,
      containsPerformance: input.containsPerformance,
      performancePeriods: input.performancePeriods,
      hypothetical: input.hypothetical,
      containsTestimonials: input.containsTestimonials,
      thirdPartyRatings: input.thirdPartyRatings,
      cta: input.cta,
      disclosures: input.disclosures,
      requiresProspectus: input.requiresProspectus,
    },
    context: {},
  };

  const inputHash = hashContent(input.content);

  const review = await runPolicyReview({
    db,
    policyKeys: [adsMarketingRuleEvaluator.key],
    reviewType: "advertising",
    evalInput,
    artifacts: [
      {
        role: "Input",
        kind: "communication",
        path: input.contentUrl,
        sha256: inputHash,
        meta: { title: input.title },
      },
    ],
  });

  if (review.outcome === "Approved" || review.outcome === "AutoApproved") {
    const stampedHash = hashContent(`${input.content}-approved-${review.review.id}`);
    const evidence = await db.evidence.create({
      kind: "communication",
      path: `${input.contentUrl}#approved`,
      sha256: stampedHash,
      meta: { reviewId: review.review.id, watermark: "APPROVED" },
    });
    await db.reviewArtifact.link({
      reviewId: review.review.id,
      evidenceId: evidence.id,
      role: "Output",
    });
  }

  return review;
};
