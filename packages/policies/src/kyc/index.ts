import { z } from "zod";
import type { KycContext, PolicyResult } from "../types.js";

const REQUIRED_DOC_TYPES = new Set(["GOV_ID", "PASSPORT", "DRIVERS_LICENSE"]);

const kycSchema = z.object({
  subjects: z
    .array(
      z.object({
        id: z.string(),
        role: z.string(),
        name: z.string(),
        pep: z.boolean().optional(),
        sanctionsHit: z.boolean().optional(),
        kycProfile: z.object({
          documents: z
            .array(
              z.object({
                type: z.string(),
                verified: z.boolean(),
                issuedCountry: z.string().optional(),
              })
            )
            .default([]),
          addressVerified: z.boolean(),
          lastVerifiedAt: z.string().optional(),
        }),
      })
    )
    .min(1),
  addressVerificationRequired: z.boolean().optional(),
});

export function core(context: KycContext): PolicyResult {
  const parsed = kycSchema.parse(context);
  const breaches: string[] = [];
  let highestRisk = 0;

  parsed.subjects.forEach((subject) => {
    const requiredDoc = subject.kycProfile.documents.find(
      (doc) => REQUIRED_DOC_TYPES.has(doc.type) && doc.verified,
    );
    if (!requiredDoc) {
      breaches.push(`kyc.missing_document:${subject.id}`);
      highestRisk = Math.max(highestRisk, 80);
    }

    if (parsed.addressVerificationRequired && !subject.kycProfile.addressVerified) {
      breaches.push(`kyc.address_unverified:${subject.id}`);
      highestRisk = Math.max(highestRisk, 70);
    }

    if (subject.pep) {
      breaches.push(`kyc.pep_flag:${subject.id}`);
      highestRisk = Math.max(highestRisk, 60);
    }

    if (subject.sanctionsHit) {
      breaches.push(`kyc.sanctions_hit:${subject.id}`);
      highestRisk = Math.max(highestRisk, 100);
    }
  });

  const pass = breaches.length === 0;
  return {
    pass,
    breaches,
    risk: pass ? 10 : highestRisk || 10,
    recommendations: pass
      ? ["Continue monitoring per AML policy"]
      : ["Collect required IDs", "Resolve screening hits"],
  };
}
