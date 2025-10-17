import { z } from "zod";

const isoDate = () =>
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Expected an ISO-8601 timestamp",
    });

export const identitySchema = z.object({
  id: z.string().min(1),
  publicKey: z.string().min(1),
  settings: z.record(z.unknown()).default({}),
});

export const boxSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  createdAt: isoDate(),
});

export const itemSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  rawText: z.string().min(1),
  createdAt: isoDate(),
});

export const assignmentSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  boxId: z.string().min(1),
  score: z.number().min(0).max(1),
  rationale: z.string().min(1),
  createdAt: isoDate(),
});

export const consentReceiptSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  purpose: z.string().min(1),
  scope: z.string().min(1),
  createdAt: isoDate(),
  expiresAt: isoDate().optional(),
});

export const classificationSuggestionSchema = z.object({
  title: z.string().min(1),
  score: z.number().min(0).max(1),
  rationale: z.string().min(1),
  tags: z.array(z.string()).default([]),
  boxId: z.string().optional(),
});

export const classificationResponseSchema = z.object({
  suggestions: z.array(classificationSuggestionSchema),
  seed: z.number().int().nonnegative(),
});

export const cryptoConfigSchema = z.object({
  kekAlgorithm: z.string().min(1),
  dataKeyAlgorithm: z.string().min(1),
  pqcEnabled: z.boolean().default(false),
});

export type IdentityInput = z.infer<typeof identitySchema>;
export type BoxInput = z.infer<typeof boxSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type ConsentReceiptInput = z.infer<typeof consentReceiptSchema>;
export type ClassificationResponseInput = z.infer<
  typeof classificationResponseSchema
>;
export type CryptoConfigInput = z.infer<typeof cryptoConfigSchema>;

export function parseIdentity(input: unknown) {
  return identitySchema.parse(input);
}

export function parseBox(input: unknown) {
  return boxSchema.parse(input);
}

export function parseItem(input: unknown) {
  return itemSchema.parse(input);
}

export function parseAssignment(input: unknown) {
  return assignmentSchema.parse(input);
}

export function parseConsentReceipt(input: unknown) {
  return consentReceiptSchema.parse(input);
}

export function parseClassificationResponse(input: unknown) {
  return classificationResponseSchema.parse(input);
}

export function parseCryptoConfig(input: unknown) {
  return cryptoConfigSchema.parse(input);
}
