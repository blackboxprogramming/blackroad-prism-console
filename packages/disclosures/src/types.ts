import { z } from "zod";

export const rawDisclosureSchema = z.object({
  source: z.enum(["BrokerCheck", "IAPD"]),
  section: z.string(),
  discoveredAt: z.string(),
  rawText: z.string(),
  fields: z.record(z.string(), z.string()).default({}),
});

export type RawDisclosure = z.infer<typeof rawDisclosureSchema>;

export const normDisclosureSchema = z.object({
  uid: z.string(),
  category: z.enum([
    "Criminal",
    "Regulatory",
    "Civil",
    "Customer",
    "Financial",
    "Termination",
    "JudgmentLien",
    "Other",
  ]),
  subType: z.string().optional(),
  status: z.enum(["Pending", "Final", "Dismissed", "Withdrawn", "Unknown"]),
  eventDate: z.string().optional(),
  allegations: z.string().optional(),
  amountClaimed: z.number().optional(),
  amountAwarded: z.number().optional(),
  resolution: z.string().optional(),
  jurisdictions: z.array(z.string()).optional(),
  parties: z.array(z.string()).optional(),
  sourceRefs: z.array(
    z.object({
      source: z.enum(["BrokerCheck", "IAPD"]),
      anchor: z.string().optional(),
    })
  ),
});

export type NormDisclosure = z.infer<typeof normDisclosureSchema>;

export interface NormDisclosureRecord extends NormDisclosure {
  severity: number;
  needsHumanReview?: boolean;
  conflict?: {
    hasConflict: boolean;
    discrepancies: string[];
  };
  stale?: boolean;
  discoveredAts?: string[];
}

export const u4AmendmentSchema = z.object({
  personId: z.string(),
  reason: z.enum(["UpdateDisclosure", "Correction"]),
  sections: z.object({
    criminal: z.any().optional(),
    regulatory: z.any().optional(),
    civil: z.any().optional(),
    terminations: z.any().optional(),
    financial: z.any().optional(),
    customer: z.any().optional(),
    other: z.any().optional(),
  }),
  dueBy: z.string(),
});

export type U4Amendment = z.infer<typeof u4AmendmentSchema>;

export const advItem11Schema = z.object({
  firmId: z.string(),
  personId: z.string().optional(),
  items: z.array(z.object({ key: z.string(), value: z.string() })),
  drps: z.array(z.object({ type: z.string(), markdown: z.string() })),
});

export type AdvItem11 = z.infer<typeof advItem11Schema>;

export interface DraftArtifact {
  path: string;
  contents: string | Buffer;
}

export interface DraftContext {
  outDir: string;
  force?: boolean;
}

export interface DueDateResult {
  dueBy: string;
  trigger: "standard" | "statutory";
}

export interface BlockerResult {
  allowed: boolean;
  reason?: string;
  requiredArtifacts?: string[];
}
