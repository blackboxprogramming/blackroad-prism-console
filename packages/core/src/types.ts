import { Decimal } from "decimal.js";

export type EntitlementStatus = "Active" | "Revoked" | "Expired";
export type SodConstraint =
  | "MUTUAL_EXCLUSION"
  | "APPROVER_CANNOT_EXECUTE"
  | "FOUR_EYES";
export type SodConflictStatus =
  | "Open"
  | "ApprovedException"
  | "Mitigated"
  | "Resolved";
export type RfcType = "CODE" | "POLICY" | "INFRA" | "CONTENT";
export type RfcStatus =
  | "Draft"
  | "InReview"
  | "Approved"
  | "Rejected"
  | "Implemented"
  | "Failed"
  | "RolledBack";
export type VendorCategory =
  | "Custodian"
  | "CryptoVenue"
  | "Data"
  | "Cloud"
  | "Advisory"
  | "Other";
export type VendorCriticality = "High" | "Medium" | "Low";
export type VendorStatus = "Active" | "Onboarding" | "Offboarded";
export type VendorDocKind =
  | "MSA"
  | "BAA"
  | "SOC2"
  | "ISO"
  | "PenTest"
  | "Insurance"
  | "Financials"
  | "BCP"
  | "Privacy";
export type DdqStatus = "Pending" | "Completed" | "Expired";
export type IncidentType =
  | "Security"
  | "Privacy"
  | "Ops"
  | "Vendor"
  | "BCP";
export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type IncidentStatus =
  | "Open"
  | "Mitigated"
  | "Resolved"
  | "Closed";
export type BcpStatus = "Active" | "Draft";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Role {
  id: string;
  key: string;
  title: string;
}

export interface Permission {
  id: string;
  key: string;
  desc: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface Entitlement {
  id: string;
  userId: string;
  roleId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date | null;
  status: EntitlementStatus;
  recertDue?: Date | null;
}

export interface SodRule {
  id: string;
  key: string;
  description: string;
  constraint: SodConstraint;
  leftRole: string;
  rightRole?: string | null;
  scope?: string | null;
  severity: number;
}

export interface SodConflict {
  id: string;
  userId: string;
  ruleKey: string;
  status: SodConflictStatus;
  createdAt: Date;
  resolvedAt?: Date | null;
  notes?: string | null;
}

export interface Rfc {
  id: string;
  title: string;
  type: RfcType;
  description: string;
  riskScore: number;
  status: RfcStatus;
  requesterId: string;
  approverIds: string[];
  submittedAt?: Date | null;
  decidedAt?: Date | null;
  implementedAt?: Date | null;
  rollbackPlan?: string | null;
  postImplReview?: unknown;
  links: unknown;
  notes?: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  criticality: VendorCriticality;
  status: VendorStatus;
  riskScore: number;
  nextReview?: Date | null;
}

export interface VendorDoc {
  id: string;
  vendorId: string;
  kind: VendorDocKind;
  path: string;
  sha256: string;
  expiresAt?: Date | null;
  receivedAt: Date;
}

export interface Ddq {
  id: string;
  vendorId: string;
  questionnaireKey: string;
  answers: unknown;
  score: number;
  status: DdqStatus;
  completedAt?: Date | null;
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: Date;
  acknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  description: string;
  rootCause?: string | null;
  correctiveActions?: string | null;
  communications: unknown;
  relatedIds: unknown;
}

export interface BcpPlan {
  id: string;
  version: number;
  effectiveAt: Date;
  rtoMinutes: number;
  rpoMinutes: number;
  contacts: unknown;
  scenarios: unknown;
  tests: unknown;
  status: BcpStatus;
}

export interface BcpTestRecord {
  id: string;
  planId: string;
  runAt: Date;
  scenario: string;
  participants: string[];
  issues: string[];
  outcome: "Pass" | "Fail" | "NeedsFollowup";
}

export interface Kri {
  id: string;
  key: string;
  label: string;
  value: Decimal;
  asOf: Date;
  meta: unknown;
}

export interface GateDecision {
  action: string;
  allowed: boolean;
  reason?: string;
  context?: Record<string, unknown>;
  evaluatedAt: Date;
}

export interface PolicyContext {
  sodSeverityThreshold: number;
  recertGraceDays: number;
  vendorCriticalRiskThreshold: number;
  defaultRecertIntervalDays: number;
  bcPlanTestCadenceDays: number;
  privacyNotificationHours: number;
  fourEyesActions: Set<string>;
}

export interface FourEyesApproval {
  action: string;
  preparerId: string;
  approverIds: string[];
}
