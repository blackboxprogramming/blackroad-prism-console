import type {
  AccountApp,
  AccountAppStatus,
  AccountChannel,
  AccountRiskTolerance,
  Business,
  Client,
  ClientRiskBand,
  ClientStatus,
  ClientType,
  Document,
  Gate,
  GateAction,
  Person,
  PersonRole,
  Screening,
  ScreeningStatus,
  ScreeningSubjectType,
  Wallet,
  WalletStatus,
} from "@blackroad/db";

export type {
  AccountApp,
  AccountAppStatus,
  AccountChannel,
  AccountRiskTolerance,
  Business,
  Client,
  ClientRiskBand,
  ClientStatus,
  ClientType,
  Document,
  Gate,
  GateAction,
  Person,
  PersonRole,
  Screening,
  ScreeningStatus,
  ScreeningSubjectType,
  Wallet,
  WalletStatus,
};

export interface SuitabilitySummary {
  score: number;
  band: ClientRiskBand;
  cryptoRiskBand?: "LOW" | "MODERATE" | "HIGH" | "SPECULATIVE";
  notes: string[];
  questionnaire: Record<string, unknown>;
}

export interface StartOnboardingInput {
  type: ClientType;
  channel: AccountChannel;
  accountType: string;
}

export interface StartOnboardingResult {
  client: Client;
  accountApp: AccountApp;
  checklist: string[];
}

export interface CreatePersonInput {
  clientId: string;
  role: PersonRole;
  name: string;
  emails?: string[];
  phones?: string[];
}

export interface CreateBusinessInput {
  clientId: string;
  legalName: string;
  formationCountry: string;
}

export interface SuitabilityInput {
  clientId: string;
  riskTolerance: AccountRiskTolerance;
  objectives: string[];
  timeHorizon: string;
  liquidityNeeds: string;
  experienceYears: number;
  crypto?: boolean;
  walletIds?: string[];
  questionnaire: Record<string, unknown>;
}

export interface DocGenerationInput {
  accountAppId: string;
  sets: string[];
}

export interface GateEvaluationResult {
  allowed: boolean;
  reason?: string;
}
