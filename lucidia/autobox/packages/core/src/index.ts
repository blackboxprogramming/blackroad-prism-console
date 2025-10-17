import { randomUUID } from "node:crypto";
import { z } from "zod";

export const identitySchema = z.object({
  id: z.string().min(1, "identity id is required"),
  publicKey: z.string().min(1, "public key is required"),
  settings: z
    .record(z.any())
    .default({})
    .describe("user-controlled configuration for consent and crypto toggles"),
});
export type Identity = z.infer<typeof identitySchema>;

export const boxSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.date(),
});
export type Box = z.infer<typeof boxSchema>;

export const itemSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  rawText: z.string().min(1),
  createdAt: z.date(),
});
export type Item = z.infer<typeof itemSchema>;

export const assignmentSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  boxId: z.string().min(1),
  score: z
    .number()
    .min(0)
    .max(1)
    .describe("confidence score normalised between 0 and 1"),
  rationale: z
    .string()
    .min(1, "rationale is required")
    .describe("short explanation for why an item belongs in the box"),
  createdAt: z.date(),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export const consentReceiptSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  purpose: z.string().min(1),
  scope: z.array(z.string()).default([]),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
});
export type ConsentReceipt = z.infer<typeof consentReceiptSchema>;

export const classificationSuggestionSchema = z.object({
  boxTitle: z.string().min(1),
  tags: z.array(z.string()).default([]),
  score: z.number().min(0).max(1),
  rationale: z.string().min(1),
});
export type ClassificationSuggestion = z.infer<typeof classificationSuggestionSchema>;

export const classificationResponseSchema = z.object({
  previewId: z.string().min(1),
  suggestions: z.array(classificationSuggestionSchema),
  processedCharacters: z.number().int().min(0),
});
export type ClassificationResponse = z.infer<typeof classificationResponseSchema>;

export const auditLogEntrySchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  action: z.string().min(1),
  createdAt: z.date(),
  context: z.record(z.any()).default({}),
});
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

export type ExportFormat = "json" | "markdown";

export function validateIdentity(input: unknown): Identity {
  return identitySchema.parse(input);
}

export function validateBox(input: unknown): Box {
  return boxSchema.parse(input);
}

export function validateItem(input: unknown): Item {
  return itemSchema.parse(input);
}

export function validateAssignment(input: unknown): Assignment {
  return assignmentSchema.parse(input);
}

export function validateConsentReceipt(input: unknown): ConsentReceipt {
  return consentReceiptSchema.parse(input);
}

export function normaliseScore(score: number): number {
  const bounded = Math.max(0, Math.min(1, score));
  return Number(bounded.toFixed(4));
}

export interface ExportPayload {
  identity: Identity;
  items: Item[];
  boxes: Box[];
  assignments: Assignment[];
}

export function exportToJson(payload: ExportPayload): string {
  return JSON.stringify(
    {
      identity: payload.identity,
      boxes: payload.boxes,
      items: payload.items,
      assignments: payload.assignments,
      exportedAt: new Date().toISOString(),
      codex: "1 — The First Principle",
    },
    null,
    2
  );
}

export function exportToMarkdown(payload: ExportPayload): string {
  const lines: string[] = [];
  lines.push(`# Lucidia Export`);
  lines.push(`Exported: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`## Identity`);
  lines.push(`- id: ${payload.identity.id}`);
  lines.push(`- publicKey: ${payload.identity.publicKey}`);
  lines.push("");
  lines.push(`## Boxes`);
  payload.boxes.forEach((box) => {
    lines.push(`- **${box.title}** (created ${box.createdAt.toISOString()})`);
    if (box.description) {
      lines.push(`  - ${box.description}`);
    }
  });
  lines.push("");
  lines.push(`## Assignments`);
  payload.assignments.forEach((assignment) => {
    lines.push(`- Item ${assignment.itemId} → Box ${assignment.boxId}`);
    lines.push(`  - Score: ${assignment.score}`);
    lines.push(`  - Rationale: ${assignment.rationale}`);
  });
  lines.push("");
  lines.push(`## Items`);
  payload.items.forEach((item) => {
    lines.push(`### Item ${item.id}`);
    lines.push("```");
    lines.push(item.rawText);
    lines.push("```");
  });
  return lines.join("\n");
}

export function createConsentReceipt(
  input: Omit<ConsentReceipt, "id" | "createdAt">
): ConsentReceipt {
  return consentReceiptSchema.parse({
    ...input,
    id: randomUUID(),
    createdAt: new Date(),
  });
}

export interface ExplainabilityRecord {
  previewId: string;
  itemText: string;
  suggestion: ClassificationSuggestion;
  minimalFeatures: string[];
}

export const explainabilityRecordSchema = z.object({
  previewId: z.string().min(1),
  itemText: z.string().min(1),
  suggestion: classificationSuggestionSchema,
  minimalFeatures: z.array(z.string()),
});
export type ExplainabilityRecord = z.infer<typeof explainabilityRecordSchema>;

export function redactRawText(input: string, maxLength = 2000): string {
  if (input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength)}…`;
}

export function buildExplainabilityRecord(
  previewId: string,
  itemText: string,
  suggestion: ClassificationSuggestion,
  minimalFeatures: string[]
): ExplainabilityRecord {
  return explainabilityRecordSchema.parse({
    previewId,
    itemText,
    suggestion,
    minimalFeatures,
  });
}

export function makePreviewId(seed: string, text: string): string {
  return `preview-${seed}-${Math.abs(
    Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  )}`;
}

export const consentPurpose = {
  ClassificationPreview: "classification_preview",
  Export: "export",
  Delete: "delete",
} as const;

export type ConsentPurpose = (typeof consentPurpose)[keyof typeof consentPurpose];

export const consentScopeSchema = z.object({
  categories: z.array(z.string()),
  expiresAt: z.date().nullable(),
});
export type ConsentScope = z.infer<typeof consentScopeSchema>;

export function requireConsent(
  receipts: ConsentReceipt[],
  purpose: ConsentPurpose
): ConsentReceipt | null {
  return (
    receipts.find(
      (receipt) =>
        receipt.purpose === purpose &&
        (!receipt.expiresAt || receipt.expiresAt.getTime() > Date.now())
    ) ?? null
  );
}

export const auditAction = {
  PreviewGenerated: "preview.generated",
  PreviewDismissed: "preview.dismissed",
  AssignmentAccepted: "assignment.accepted",
  ExportTriggered: "export.triggered",
  DeleteTriggered: "delete.triggered",
} as const;
export type AuditAction = (typeof auditAction)[keyof typeof auditAction];

export function makeAuditLogEntry(
  ownerId: string,
  action: AuditAction,
  context: Record<string, unknown>
): AuditLogEntry {
  return auditLogEntrySchema.parse({
    id: randomUUID(),
    ownerId,
    action,
    context,
    createdAt: new Date(),
  });
}

