export type UserRole = "admin" | "user";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export type PolicyStatus = "Active" | "Draft" | "Retired";

export interface PolicyRecord {
  id: string;
  key: string;
  title: string;
  version: number;
  status: PolicyStatus;
  body: unknown;
  controls: string[];
  effectiveAt: Date;
  supersedesId?: string | null;
  createdAt: Date;
}

export type AttestationPeriod = "Annual" | "Initial" | "AdHoc";

export interface AttestationRecord {
  id: string;
  userId: string;
  policyId: string;
  period: AttestationPeriod;
  answers: unknown;
  signedAt: Date;
}

export interface EvidenceRecord {
  id: string;
  kind: string;
  path: string;
  sha256: string;
  meta: unknown;
  createdAt: Date;
}

export type ReviewOutcome =
  | "Approved"
  | "Rejected"
  | "NeedsChanges"
  | "AutoApproved"
  | "Escalated";

export interface ReviewRecord {
  id: string;
  type: string;
  input: unknown;
  outcome: ReviewOutcome;
  riskScore: number;
  breaches: string[];
  notes?: string | null;
  reviewerId?: string | null;
  createdAt: Date;
}

export type ReviewArtifactRole = "Input" | "Output" | "Approval" | "Disclosure";

export interface ReviewArtifactRecord {
  id: string;
  reviewId: string;
  evidenceId: string;
  role: ReviewArtifactRole;
}

export type CalendarStatus = "Open" | "Done" | "Snoozed" | "Waived";

export interface CalendarItemRecord {
  id: string;
  key: string;
  summary: string;
  due: Date;
  track: string;
  stateCode?: string | null;
  status: CalendarStatus;
  blockers: string[];
  createdAt: Date;
}

export interface GateRecord {
  id: string;
  action: string;
  context: unknown;
  allowed: boolean;
  reason?: string | null;
  createdAt: Date;
}

export interface WormBlockRecord {
  id: string;
  idx: number;
  ts: Date;
  payload: unknown;
  prevHash: string;
  hash: string;
}

export interface CreateEvidenceInput {
  kind: string;
  path: string;
  sha256: string;
  meta: unknown;
}

export interface CreateReviewInput {
  type: string;
  input: unknown;
  outcome: ReviewOutcome;
  riskScore: number;
  breaches: string[];
  notes?: string | null;
  reviewerId?: string | null;
}

export interface ComplianceDb {
  policy: {
    findByKey(key: string): Promise<PolicyRecord | null>;
    create(input: Omit<PolicyRecord, "id" | "createdAt">): Promise<PolicyRecord>;
    update(id: string, input: Partial<Omit<PolicyRecord, "id" | "createdAt">>): Promise<PolicyRecord>;
    list(): Promise<PolicyRecord[]>;
  };
  attestation: {
    create(input: Omit<AttestationRecord, "id">): Promise<AttestationRecord>;
    findLatest(userId: string, policyId: string): Promise<AttestationRecord | null>;
  };
  review: {
    create(input: CreateReviewInput): Promise<ReviewRecord>;
  };
  evidence: {
    create(input: CreateEvidenceInput): Promise<EvidenceRecord>;
  };
  reviewArtifact: {
    link(input: Omit<ReviewArtifactRecord, "id">): Promise<ReviewArtifactRecord>;
  };
  calendar: {
    upsertByKey(
      key: string,
      input: Omit<CalendarItemRecord, "id" | "createdAt" | "key">
    ): Promise<CalendarItemRecord>;
    listOpen(): Promise<CalendarItemRecord[]>;
    setStatus(id: string, status: CalendarStatus, reason?: string): Promise<CalendarItemRecord>;
  };
  gate: {
    create(input: Omit<GateRecord, "id" | "createdAt">): Promise<GateRecord>;
  };
  worm: {
    getLatest(): Promise<WormBlockRecord | null>;
    append(input: Omit<WormBlockRecord, "id">): Promise<WormBlockRecord>;
    list(): Promise<WormBlockRecord[]>;
  };
}
