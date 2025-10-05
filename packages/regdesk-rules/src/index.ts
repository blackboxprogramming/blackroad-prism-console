import { promises as fs } from 'node:fs';
import { extname } from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';

export const scheduleSchema = z.object({
  freq: z.enum(['ANNUAL', 'QUARTERLY', 'MONTHLY', 'WINDOW']),
  dueMonth: z.number().int().min(1).max(12).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  windowDays: z.number().int().positive().optional(),
  offsetFrom: z.enum(['FISCAL_YEAR_END', 'LICENSE_EXPIRY', 'ANNIVERSARY']).optional(),
  offsetDays: z.number().int().optional()
});

export const filingSchema = z
  .object({
    type: z.enum(['IARD', 'CRD', 'STATE_PORTAL', 'NONE']),
    formKeys: z.array(z.string()).default([]),
    feePolicy: z.enum(['CALCULATED', 'FLAT', 'NONE']).optional(),
    artifactsRequired: z.array(z.enum(['PDF', 'CSV', 'RECEIPT', 'ATTESTATION'])).default([])
  })
  .optional();

export const deliverySchema = z
  .object({
    docKind: z.enum(['FORM_CRS', 'ADV_2A', 'ADV_2B', 'PRIVACY', 'BCP']),
    trigger: z.enum(['INITIAL', 'ANNUAL', 'MATERIAL_CHANGE']),
    methodsAllowed: z.array(z.enum(['EMAIL', 'PORTAL', 'IN_PERSON', 'MAIL'])),
    proofRequired: z.array(z.enum(['EVIDENCE', 'ACK'])).default([])
  })
  .optional();

export const gatesSchema = z
  .object({
    blockActions: z.array(
      z.enum(['advise', 'market', 'open_account', 'trade_bd', 'sell_insurance'])
    ),
    graceDays: z.number().int().nonnegative().optional()
  })
  .optional();

export const ruleSchema = z.object({
  key: z.string(),
  track: z.enum(['RIA', 'BD', 'INSURANCE', 'REALESTATE']),
  stateCode: z.string().optional(),
  schedule: scheduleSchema,
  filing: filingSchema,
  delivery: deliverySchema,
  gates: gatesSchema
});

export const rulepackSchema = z.object({
  key: z.string(),
  version: z.number().int().positive(),
  rules: z.array(ruleSchema),
  sourceUrls: z.array(z.string()).default([])
});

export type Rule = z.infer<typeof ruleSchema>;
export type Rulepack = z.infer<typeof rulepackSchema>;

export async function loadRulepack(path: string): Promise<Rulepack> {
  const raw = await fs.readFile(path, 'utf8');
  let data: unknown;
  if (extname(path).toLowerCase() === '.yaml' || extname(path).toLowerCase() === '.yml') {
    data = YAML.parse(raw);
  } else {
    data = JSON.parse(raw);
  }
  return rulepackSchema.parse(data);
}

export async function loadRulepacks(paths: string[]): Promise<Rulepack[]> {
  return Promise.all(paths.map(loadRulepack));
}

export function serializeRulepack(rulepack: Rulepack): string {
  return YAML.stringify(rulepack);
}

export function findRule(rulepack: Rulepack, ruleKey: string): Rule | undefined {
  return rulepack.rules.find((rule) => rule.key === ruleKey);
}

export function groupRulesByTrack(rulepacks: Rulepack[]): Map<string, Rule[]> {
  const grouped = new Map<string, Rule[]>();
  for (const pack of rulepacks) {
    for (const rule of pack.rules) {
      const bucket = grouped.get(rule.track) ?? [];
      bucket.push(rule);
      grouped.set(rule.track, bucket);
    }
  }
  return grouped;
}
