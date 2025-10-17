import type {
  DeliveryLog,
  Filing,
  Gate,
  RegEvent,
  Rulepack,
  WormBlock
} from '@blackroad/regdesk-db';
import type { Rule } from '@blackroad/regdesk-rules';

export type { DeliveryLog, Filing, Gate, RegEvent, Rulepack, WormBlock, Rule };

export interface ScheduleRange {
  from: Date;
  to: Date;
}

export interface ScheduleContext {
  fiscalYearEnd: Date;
  licenseExpiries: Record<string, Date>;
  anniversaries: Record<string, Date>;
}

export interface FilingArtifact {
  name: string;
  path: string;
  checksum: string;
}

export interface DeliveryEvidence {
  path: string;
  checksum: string;
}

export interface DeliveryRequest {
  docKind: DeliveryLog['docKind'];
  clients: string[];
  method: DeliveryLog['method'];
  evidencePath: string;
  version: string;
  meta?: Record<string, unknown>;
}

export interface AuditPayload extends Record<string, unknown> {
  actor: string;
  action: string;
  entity?: string;
}
