import { z } from "zod";

export const contactSchema = z.object({
  team: z.string().min(1),
  slack: z.string().optional(),
  email: z.string().email().optional(),
  pagerduty: z.string().optional()
});

export const guardSchema = z.object({
  description: z.string(),
  required: z.boolean().default(false)
});

export const variableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "enum"]).default("string"),
  enum: z.array(z.string()).optional(),
  description: z.string().optional(),
  required: z.boolean().default(true),
  default: z.any().optional()
});

export const stepSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["manual", "verify", "execute"]),
  description: z.string().optional(),
  notes: z.string().optional(),
  verify: z
    .object({
      description: z.string()
    })
    .optional(),
  execute: z
    .object({
      action: z.string().min(1),
      inputs: z.record(z.any()).default({})
    })
    .optional(),
  guards: z.array(guardSchema).default([]),
  durationEstimateMin: z.number().min(0).default(2)
});

export const executionSchema = z.object({
  workflowName: z.string().min(1),
  version: z.string().min(1),
  idempotencyKeyHint: z.string().default("rb-${runbook.id}-${ts}"),
  variables: z.array(variableSchema).default([]),
  dryRunSupported: z.boolean().default(true)
});

export const runbookSchema = z.object({
  apiVersion: z.literal("rb.blackroad.io/v1"),
  kind: z.literal("Runbook"),
  metadata: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    owners: z.array(z.string()).min(1),
    tags: z.array(z.string()).default([]),
    severity: z.enum(["info", "minor", "major", "critical"]).default("info"),
    lastReviewedAt: z.string().optional(),
    deprecated: z.boolean().default(false)
  }),
  preconditions: z.array(z.string()).default([]),
  impact: z.string().optional(),
  rollback: z.array(z.string()).default([]),
  contacts: contactSchema,
  steps: z.array(stepSchema).min(1),
  execution: executionSchema
});

export type Runbook = z.infer<typeof runbookSchema>;
export type RunbookStep = z.infer<typeof stepSchema>;
export type RunbookVariable = z.infer<typeof variableSchema>;

export interface RunbookValidationResult {
  runbook: Runbook;
  filePath: string;
}

export const runbookArraySchema = z.array(runbookSchema);
