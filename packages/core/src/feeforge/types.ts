import { DateTime } from "luxon";

export type Tier = { upTo?: number; rateBps: number };

export type DiscountRule = "HOUSEHOLD" | "ASSET_CLASS" | "INTRO";
export type AdderRule = "CRYPTO" | "OPTIONS";

export type FeeComponentLabel =
  | "BASE_TIER"
  | "DISCOUNT"
  | "ADDER"
  | "CAP_ADJUSTMENT"
  | "MINIMUM_ADJUSTMENT"
  | "REFUND"
  | "PERFORMANCE";

export interface DiscountComponent {
  label: string;
  rule: DiscountRule;
  bps?: number;
  amountUSD?: number;
}

export interface AdderComponent {
  label: string;
  rule: AdderRule;
  bps?: number;
  amountUSD?: number;
}

export type BaseMethod = "AUM_TIERED" | "FLAT" | "HOURLY" | "PROJECT";

export interface PerfSpec {
  hwm: boolean;
  hurdleRateBps?: number;
  crystallize: "Quarterly" | "Annually";
}

export interface FeeSpec {
  base: {
    method: BaseMethod;
    tiers?: Tier[];
    flatAnnualUSD?: number;
  };
  minimumUSD?: number;
  discounts?: DiscountComponent[];
  adders?: AdderComponent[];
  capBps?: number;
  allowFeeCreditsFromMF?: boolean;
  performance?: PerfSpec | null;
  householding: { enabled: boolean; includeAccounts: string[] | "ALL" };
  valuation: { method: "EOD_MV"; includeCrypto: boolean; priceSource: "CustodySync" };
}

export interface FeeSchedule {
  id: string;
  name: string;
  status: "Active" | "Draft" | "Retired";
  spec: FeeSpec;
  createdAt: Date;
  updatedAt: Date;
}

export type BillingFrequency = "Monthly" | "Quarterly";
export type BillingMode = "InArrears" | "InAdvance";
export type BillingCurrency = "USD" | "CRYPTO_USD_EQ";

export interface AccountFeePlan {
  id: string;
  accountId: string;
  feeScheduleId: string;
  billingGroupId?: string | null;
  startDate: Date;
  endDate?: Date | null;
  billFrequency: BillingFrequency;
  billMode: BillingMode;
  billCurrency: BillingCurrency;
  custodyDeductionAllowed: boolean;
  performanceFeeAllowed: boolean;
  createdAt: Date;
}

export interface MarketValueSlice {
  accountId: string;
  asOf: Date;
  householdId?: string;
  householdTotal?: number;
  marketValue: number;
  cryptoMarketValue?: number;
}

export interface FeeAccrualComponent {
  label: FeeComponentLabel;
  detail: string;
  amount: number;
  rateBps?: number;
}

export interface FeeAccrualRecord {
  accountId: string;
  asOf: Date;
  baseAUM: number;
  rateBps: number;
  amount: number;
  components: FeeAccrualComponent[];
  planId: string;
  scheduleId: string;
}

export interface InvoiceLineComponent {
  label: FeeComponentLabel;
  amount: number;
  meta?: Record<string, unknown>;
}

export interface InvoiceLine {
  accountId: string;
  amount: number;
  components: InvoiceLineComponent[];
}

export interface InvoiceDraft {
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  billingGroupId?: string | null;
  accountId?: string | null;
  currency: string;
  amount: number;
  lines: InvoiceLine[];
  minimumAppliedUSD?: number;
}

export interface RefundInstruction {
  accountId: string;
  amount: number;
  reason: string;
}

export interface PerformanceContext {
  asOf: Date;
  periodStart: Date;
  highWaterMark?: number;
  currentValue: number;
  netDeposits?: number;
}

export interface PerformanceComputationResult {
  eligible: boolean;
  earnedFeeUSD: number;
  rationale: string;
}

export interface AccrualComputationInput {
  plan: AccountFeePlan;
  schedule: FeeSchedule;
  marketValue: MarketValueSlice;
  householdValue?: number;
  performance?: PerformanceContext;
}

export interface ProrationContext {
  asOf: DateTime;
  start: DateTime;
  end?: DateTime | null;
}

export interface ExceptionDetail {
  code:
    | "CAP_EXCEEDED"
    | "PERF_NOT_ELIGIBLE"
    | "NO_AUTH"
    | "MF_COMMISSION_REBATE"
    | "PAYMENT_FAILED";
  severity: number;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ExceptionRecord extends ExceptionDetail {
  id: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  status: "Open" | "Approved" | "Rejected" | "Waived";
}

export interface ExceptionQueue {
  enqueue(detail: ExceptionDetail): ExceptionRecord;
  resolve(id: string, status: ExceptionRecord["status"], note?: string): ExceptionRecord;
  listOpen(): ExceptionRecord[];
}

export interface CustodyAuthorization {
  planId: string;
  granted: boolean;
  artifactUri?: string;
  grantedAt?: Date;
}

