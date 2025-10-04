import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ComplianceDb } from "@blackroad/compliance-db";
import { advertising } from "@blackroad/compliance-reviewers";

const AdvertisingRequest = z.object({
  title: z.string(),
  contentUrl: z.string(),
  content: z.string().optional(),
  containsPerformance: z.boolean().optional(),
  performancePeriods: z.array(z.string()).optional(),
  hypothetical: z.boolean().optional(),
  containsTestimonials: z.boolean().optional(),
  thirdPartyRatings: z.boolean().optional(),
  disclosures: z.array(z.string()).optional(),
  cta: z.string().optional(),
});

export const registerReviewRoutes = (fastify: FastifyInstance, db: ComplianceDb) => {
  fastify.post(
    "/reviews/advertising",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const parsed = AdvertisingRequest.parse(request.body);
      const review = await advertising.runReview(db, {
        ...parsed,
        content: parsed.content ?? `${parsed.title}::${parsed.contentUrl}`,
      });

      reply.status(201).send({
        reviewId: review.review.id,
        outcome: review.outcome,
        riskScore: review.aggregate.riskScore,
        breaches: review.aggregate.breaches,
      });
    }
  );
};
