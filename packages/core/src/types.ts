export type TrackType = "securities" | "insurance" | "real_estate";

export type LicenseStatus = "Active" | "Expired" | "Lapsed" | "Barred" | "Unknown";

export type TaskStatus = "Open" | "Done" | "Blocked" | "N/A";

export type FilingArtifactKind =
  | "Form"
  | "ProofCE"
  | "Fee"
  | "Fingerprint"
  | "Background"
  | "Appointment"
  | "Bond"
  | "Affidavit"
  | "ExamPass";

export interface PersonPriorEmployer {
  name: string;
  role?: string;
}

export interface Person {
  id: string;
  legalName: string;
  aka: string[];
  crdNumber?: string;
  homeState: string;
  tracks: TrackType[];
  targetStates: string[];
  disclosures: string[];
  designations: string[];
  priorEmployers: PersonPriorEmployer[];
}

export interface LicenseTrack {
  id: string;
  personId: string;
  track: TrackType;
  stateCode: string;
  licenseType: string;
  status: LicenseStatus;
  number?: string;
  lastRenewal?: Date;
  expiration?: Date;
  ceHoursEarned?: number;
  ceHoursRequired?: number;
  notes?: string;
  metadata?: Record<string, unknown> | null;
}

export interface Rulebook {
  id: string;
  stateCode: string;
  track: TrackType;
  licenseType: string;
  version: number;
  sourceUrls: string[];
  rules: ReinstatementRule;
}

export type TransitionFrom = "Expired" | "Lapsed" | "Unknown";
export type TransitionTo = "Active" | "Requalify";

export interface TransitionRule {
  from: TransitionFrom;
  to: TransitionTo;
  conditions: string[];
  tasks: TaskTemplateKey[];
}

export interface ReinstatementRule {
  graceWindowDays?: number;
  reinstatementWindowDays?: number;
  requiresExamRetakeIfBeyondDays?: number;
  requiresPrelicensingIfBeyondDays?: number;
  ce: {
    requiredHours: number;
    ethicsHours?: number;
    carryover?: boolean;
  } | null;
  backgroundCheck: {
    fingerprints: boolean;
  } | null;
  sponsorRequired: boolean;
  formSet: FormKey[];
  fees: {
    renewal?: number;
    reinstatementPenalty?: number;
    exam?: number;
  } | null;
  appointmentsResetOnReinstatement?: boolean;
  docsNeeded: DocKey[];
  transitions: TransitionRule[];
}

export type FormKey = "U4" | "U5" | "ADV" | "StateApp" | "NIPR" | "Sircon" | "RealEstateApp";

export type DocKey = "PhotoID" | "ResidentProof" | "ExamPass" | "CECert" | "Bond" | "Affidavit";

export type TaskTemplateKey =
  | "FETCH_CRD_HISTORY"
  | "PARSE_BROKERCHECK_PDF"
  | "VERIFY_DISCLOSURES"
  | "SCHEDULE_SERIES65_EXAM"
  | "FILE_U4"
  | "ADV_FILE_FIRM"
  | "INSURANCE_REINSTATE_VIA_SIRCON"
  | "UPLOAD_CE_CERTS"
  | "PAY_REINSTATEMENT_FEE"
  | "REAL_ESTATE_REINSTATE"
  | "FINGERPRINTS"
  | "APPOINTMENTS_REAPPLY"
  | "SECURE_BD_SPONSOR"
  | "VERIFY_LICENSE_EXPIRATION"
  | "COMPLETE_BACKGROUND_CHECK"
  | "SUBMIT_STATE_APPLICATION"
  | "PAY_STATE_FEES"
  | "PRELICENSING_COURSE"
  | "SCHEDULE_INSURANCE_EXAM"
  | "NEW_APPLICATION"
  | "SCHEDULE_REAL_ESTATE_EXAM";

export interface TaskTemplate {
  key: TaskTemplateKey;
  title: string;
  description: string;
  blocking: boolean;
  defaultDueInDays?: number;
  requiredArtifacts: FilingArtifactKind[];
}

export interface PlannedTask {
  id: string;
  personId: string;
  stateCode: string;
  track: TrackType;
  licenseType: string;
  template: TaskTemplateKey;
  title: string;
  status: TaskStatus;
  blocking: boolean;
  due?: Date | null;
  payload?: Record<string, unknown>;
  requiredArtifacts: FilingArtifactKind[];
}

export interface RuleEvaluationResult {
  target: TransitionTo;
  tasks: PlannedTask[];
  blockers: string[];
  fees: {
    renewal?: number;
    reinstatementPenalty?: number;
    exam?: number;
  } | null;
  notes: string[];
}

export interface PlanOptions {
  targetStates: string[];
  targetTracks: TrackType[];
  now?: Date;
}

export interface PlannerResult {
  tasks: PlannedTask[];
  summaries: PlanSummary[];
}

export interface PlanSummary {
  stateCode: string;
  track: TrackType;
  licenseType: string;
  targetStatus: TransitionTo;
  blockers: string[];
  fees: {
    renewal?: number;
    reinstatementPenalty?: number;
    exam?: number;
  } | null;
  tasks: PlannedTask[];
}

export interface GateResult {
  allowed: boolean;
  reason?: string;
}

export interface TaskCompletionPayload {
  taskId: string;
  artifacts: Array<{ kind: FilingArtifactKind; path: string }>;
}
