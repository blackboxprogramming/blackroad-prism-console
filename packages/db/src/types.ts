export type ClientType = "INDIVIDUAL" | "TRUST" | "BUSINESS";
export type ClientStatus = "Prospect" | "KYC_PENDING" | "DocsPending" | "ReadyToOpen" | "Active" | "Rejected";
export type ClientRiskBand = "LOW" | "MODERATE" | "HIGH" | "SPECULATIVE";

export type PersonRole =
  | "PRIMARY"
  | "JOINT"
  | "BENEFICIAL_OWNER"
  | "CONTROL_PERSON"
  | "TRUSTEE"
  | "GRANTOR"
  | "AUTH_TRADER";

export type AccountChannel = "RIA" | "BD" | "INSURANCE" | "CRYPTO";
export type AccountRiskTolerance = "Low" | "Moderate" | "High" | "Speculative";
export type AccountAppStatus = "Draft" | "NeedsReview" | "ReadyToSubmit" | "Submitted" | "Opened" | "Rejected";

export type ScreeningSubjectType = "PERSON" | "BUSINESS" | "WALLET";
export type ScreeningStatus = "CLEAR" | "REVIEW" | "HIT";
export type GateAction = "advise" | "open_account" | "trade" | "enable_options" | "enable_margin" | "enable_crypto";
export type WalletChain = "BTC" | "ETH" | "SOL" | "OTHER";
export type WalletStatus = "UNVERIFIED" | "VERIFIED" | "RESTRICTED";

export interface Client {
  id: string;
  type: ClientType;
  status: ClientStatus;
  riskBand?: ClientRiskBand;
  suitability: unknown;
  createdAt: Date;
}

export interface Person {
  id: string;
  clientId: string;
  role: PersonRole;
  name: string;
  dob?: Date;
  ssnLast4?: string;
  tin?: string;
  phones: string[];
  emails: string[];
  addresses: Record<string, unknown>;
  kyc: Record<string, unknown>;
  pep?: boolean;
  sanctionsHit?: boolean;
}

export interface Business {
  id: string;
  clientId: string;
  legalName: string;
  formationCountry: string;
  formationState?: string;
  ein?: string;
  naics?: string;
  controlPersons: string[];
  beneficialOwners: string[];
  kyb: Record<string, unknown>;
}

export interface AccountApp {
  id: string;
  clientId: string;
  channel: AccountChannel;
  accountType: string;
  optionsLevel?: number;
  margin?: boolean;
  objectives: string[];
  timeHorizon: string;
  liquidityNeeds: string;
  riskTolerance: AccountRiskTolerance;
  disclosuresAccepted: string[];
  eSignEnvelopeId?: string;
  status: AccountAppStatus;
  meta: Record<string, unknown>;
}

export interface Document {
  id: string;
  clientId?: string;
  accountAppId?: string;
  kind: string;
  path: string;
  sha256: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

export interface Screening {
  id: string;
  clientId: string;
  subjectType: ScreeningSubjectType;
  subjectId: string;
  provider: string;
  result: Record<string, unknown>;
  score: number;
  status: ScreeningStatus;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  clientId: string;
  chain: WalletChain;
  address: string;
  label?: string;
  riskScore?: number;
  lastScreenedAt?: Date;
  status: WalletStatus;
}

export interface WormBlock {
  id: string;
  idx: number;
  ts: Date;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface Gate {
  id: string;
  clientId: string;
  action: GateAction;
  allowed: boolean;
  reason?: string;
  createdAt: Date;
}
