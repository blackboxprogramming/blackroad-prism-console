import { DateTime } from "luxon";

export type AlertKind = "TRADE" | "CRYPTO" | "COMMS" | "INSIDER" | "SYSTEM";
export type AlertStatus = "Open" | "Suppressed" | "InCase" | "Closed";

export interface SurveillanceAlert {
  id: string;
  kind: AlertKind;
  scenario: string;
  severity: number; // 0-100 scale
  status: AlertStatus;
  key: string;
  signal: Record<string, unknown>;
  createdAt: Date;
}

export type TradeSide = "BUY" | "SELL";

export interface TradeRecord {
  id: string;
  accountId: string;
  householdId?: string;
  repId?: string;
  symbol: string;
  assetType: "EQUITY" | "FUND" | "OPTION" | "BOND" | "CRYPTO";
  side: TradeSide;
  quantity: number;
  price: number;
  executedAt: Date;
  orderId?: string;
  clientAccount?: string;
  isEmployeeAccount?: boolean;
}

export interface WalletTransfer {
  id: string;
  wallet: string;
  asset: string;
  direction: "IN" | "OUT";
  amount: number;
  txHash: string;
  timestamp: Date;
  counterparty?: string;
  hops?: number;
  screeningPath?: ScreeningHop[];
}

export interface ScreeningHop {
  address: string;
  tag: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "SEVERE";
  distance: number;
}

export interface MixerScreeningResult {
  wallet: string;
  hops: ScreeningHop[];
  isMixerProximity: boolean;
  maxRisk: "LOW" | "MEDIUM" | "HIGH" | "SEVERE";
}

export interface ScenarioPolicies {
  washTradeLookbackMinutes: number;
  washTradeMinQuantity: number;
  frontRunWindowMinutes: number;
  frontRunMinNotional: number;
  mixerMaxHops: number;
  mixerSevereRisk: number;
}

export const defaultScenarioPolicies: ScenarioPolicies = {
  washTradeLookbackMinutes: 5,
  washTradeMinQuantity: 100,
  frontRunWindowMinutes: 5,
  frontRunMinNotional: 5000,
  mixerMaxHops: 2,
  mixerSevereRisk: 90,
};

export interface ScenarioContext {
  trades: TradeRecord[];
  walletTransfers: WalletTransfer[];
  policies?: Partial<ScenarioPolicies>;
  screeningResults?: MixerScreeningResult[];
}

export interface ScenarioDetector {
  name: string;
  detect(context: ScenarioContext): Promise<SurveillanceAlert[]> | SurveillanceAlert[];
}

export interface LexiconDefinition {
  key: string;
  phrases: (string | RegExp)[];
  proximity: number;
  riskBase: number;
}

export interface CommRecord {
  id: string;
  channel: "EMAIL" | "IM" | "SMS" | "FILE" | "NOTE";
  threadId?: string;
  from: string;
  to: string[];
  subject?: string;
  ts: Date;
  text: string;
}

export interface LexiconHit {
  commId: string;
  lexiconKey: string;
  phrase: string;
  offsets: [number, number];
  risk: number;
  snippet: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  status: CaseStatus;
  ownerId?: string;
  summary?: string;
  alerts: SurveillanceAlert[];
  createdAt: Date;
  closedAt?: Date;
}

export type CaseStatus =
  | "Open"
  | "UnderReview"
  | "Escalated"
  | "SAR_Drafted"
  | "Closed_NoIssue"
  | "Closed_Remediation"
  | "Closed_SARFiled";

export type CaseItemType = "Alert" | "Trade" | "WalletTx" | "Comm" | "Document" | "Note" | "Task";

export interface CaseItemRecord {
  id: string;
  caseId: string;
  type: CaseItemType;
  refId: string;
  meta: Record<string, unknown>;
}

export interface InsiderIssuerRecord {
  id: string;
  symbol?: string;
  name: string;
  event: "EARNINGS" | "MNA" | "SECONDARY" | "TOKEN_LISTING" | "OTHER";
  windowStart: Date;
  windowEnd: Date;
  restrictedList: boolean;
}

export interface InsiderPersonRecord {
  id: string;
  personId: string;
  issuerId: string;
  wallCrossedAt: Date;
  notes?: string;
}

export function minutesBetween(a: Date, b: Date): number {
  const diff = Math.abs(DateTime.fromJSDate(a).diff(DateTime.fromJSDate(b), "minutes").minutes);
  return Math.abs(diff);
}

export function hoursBetween(a: Date, b: Date): number {
  const diff = Math.abs(DateTime.fromJSDate(a).diff(DateTime.fromJSDate(b), "hours").hours);
  return Math.abs(diff);
}
