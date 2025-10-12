import { Decimal } from "decimal.js";
import { z } from "zod";

export const assetClassSchema = z.enum([
  "EQUITY",
  "ETF",
  "MUTUAL_FUND",
  "OPTION",
  "BOND",
  "CRYPTO",
]);

export type AssetClass = z.infer<typeof assetClassSchema>;

export const orderSideSchema = z.enum([
  "BUY",
  "SELL",
  "SELL_SHORT",
  "BUY_TO_OPEN",
  "SELL_TO_CLOSE",
]);

export type OrderSide = z.infer<typeof orderSideSchema>;

export const priceTypeSchema = z.enum(["MKT", "LMT", "STOP", "STOP_LIMIT"]);
export type PriceType = z.infer<typeof priceTypeSchema>;

export const tifSchema = z.enum(["DAY", "GTC", "IOC", "FOK"]);
export type TimeInForce = z.infer<typeof tifSchema>;

export const orderStatusSchema = z.enum([
  "NEW",
  "HELD",
  "ROUTED",
  "PARTIAL",
  "FILLED",
  "CANCELLED",
  "REJECTED",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export interface OrderInput {
  clientId: string;
  accountId: string;
  traderId: string;
  side: OrderSide;
  instrumentId: string;
  assetClass: AssetClass;
  qty: Decimal | number | string;
  priceType: PriceType;
  limitPrice?: Decimal | number | string | null;
  timeInForce: TimeInForce;
  routePref?: string | null;
  meta?: Record<string, unknown>;
}

export interface Order extends OrderInput {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  heldReasons?: string[];
  executions: Execution[];
  blockId?: string;
  qty: Decimal;
  limitPrice?: Decimal;
  meta?: Record<string, unknown>;
}

export const executionSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  venue: z.string(),
  execId: z.string(),
  qty: z.string(),
  price: z.string(),
  ts: z.date(),
  fees: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

export interface Execution {
  id: string;
  orderId: string;
  venue: string;
  execId: string;
  qty: Decimal;
  price: Decimal;
  ts: Date;
  fees?: Decimal;
  meta?: Record<string, unknown>;
}

export type BlockStatus = "STAGED" | "ROUTED" | "FILLED" | "ALLOCATED" | "CLOSED";

export interface Block {
  id: string;
  assetClass: AssetClass;
  instrumentId: string;
  side: OrderSide;
  totalQty: Decimal;
  status: BlockStatus;
  orderIds: string[];
  createdAt: Date;
  executions: Execution[];
  bestExRecord?: BestExRecord;
}

export interface Allocation {
  id: string;
  blockId: string;
  accountId: string;
  qty: Decimal;
  avgPrice: Decimal;
  method: AllocationMethod;
  status: AllocationStatus;
  meta?: Record<string, unknown>;
}

export type AllocationMethod = "PRO_RATA" | "ROUND_LOT" | "MANUAL";
export type AllocationStatus = "PENDING" | "POSTED" | "ADJUSTED";

export interface BestExRecord {
  id: string;
  blockId: string;
  considered: string[];
  chosen: string;
  score: Record<string, number>;
  reason: string;
  overridden: boolean;
  approverId?: string;
  createdAt: Date;
}

export type TradeErrorType =
  | "WRONG_ACCT"
  | "WRONG_QTY"
  | "WRONG_SYMBOL"
  | "LATE_ALLOC"
  | "MISMATCH"
  | "CRYPTO_SETTLEMENT";

export type TradeErrorStatus =
  | "Open"
  | "Segregated"
  | "Corrected"
  | "ClientCompensated"
  | "Closed";

export interface TradeErrorItem {
  id: string;
  orderId?: string;
  executionId?: string;
  type: TradeErrorType;
  status: TradeErrorStatus;
  segregationAccountId?: string;
  pnl?: Decimal;
  notes?: string;
  createdAt: Date;
  closedAt?: Date;
  approvals: string[];
}

export interface Confirm {
  id: string;
  orderId: string;
  accountId: string;
  instrumentId: string;
  side: OrderSide;
  qty: Decimal;
  avgPrice: Decimal;
  fees?: Decimal;
  ts: Date;
  path: string;
  sha256: string;
}

export interface BlotterExportResult {
  path: string;
  sha256: string;
  rows: BlotterRow[];
}

export interface BlotterRow {
  orderId: string;
  accountId: string;
  instrumentId: string;
  side: OrderSide;
  qty: Decimal;
  avgPrice: Decimal;
  status: OrderStatus;
  ts: Date;
}

export interface PreTradeResult {
  passed: boolean;
  reasons: string[];
  warnings: string[];
  gated?: boolean;
}

export interface PreTradeContext {
  order: Order;
}

export interface VenueScoreInput {
  venue: string;
  price: number;
  size: number;
  liquidity: number;
  fees: number;
  rebate: number;
  speed: number;
  historicalFill: number;
  slippage?: number;
  reliability?: number;
}

export interface VenueSelectionRequest {
  block: Block;
  venues: VenueScoreInput[];
  override?: { venue: string; reason: string; approverId?: string };
}

export interface VenueSelectionResult {
  record: BestExRecord;
}

export interface RoutingDecision {
  venue: string;
  executions: Execution[];
}

export interface AccountGateSnapshot {
  accountId: string;
  kycCleared: boolean;
  amlCleared: boolean;
  suitability: boolean;
  optionsLevel: number;
  marginApproved: boolean;
  cryptoEnabled: boolean;
  wallets: Record<string, { whitelisted: boolean; label?: string }>;
}

export interface ComplianceSnapshot {
  restrictedSymbols: Set<string>;
  ipoCoolingOff: Record<string, { effectiveDate: Date; tombstoneOnly?: boolean }>;
  marketingHold: boolean;
  amlFlag: boolean;
  requiresU4Amendment?: boolean;
}

export interface CustodyPositionSnapshot {
  cash: Decimal;
  positions: Record<string, Decimal>;
  lots: Record<string, Decimal[]>;
}

export interface ClientOSGateway {
  getAccountGates(accountId: string): Promise<AccountGateSnapshot>;
  verifyWallet(accountId: string, address: string): Promise<boolean>;
}

export interface ComplianceOSGateway {
  getSnapshot(accountId: string, instrumentId: string): Promise<ComplianceSnapshot>;
  isSymbolRestricted(symbol: string, asOf: Date): Promise<{ restricted: boolean; reason?: string }>;
  recordOverride(event: { type: string; details: Record<string, unknown> }): Promise<void>;
}

export interface CustodySyncGateway {
  getSnapshot(accountId: string, instrumentId: string): Promise<CustodyPositionSnapshot>;
  updatePosition(input: {
    accountId: string;
    instrumentId: string;
    quantity: Decimal;
    cashDelta: Decimal;
    avgPrice: Decimal;
  }): Promise<void>;
}

export interface SurveillanceHubGateway {
  isInsider(accountId: string, instrumentId: string): Promise<boolean>;
}

export interface RegDeskGateway {
  logConfirm(confirm: Confirm): Promise<void>;
}

export interface FeeForgeGateway {
  getMutualFundRules(symbol: string): Promise<{ popOnly: boolean; breakpointEligible: boolean }>;
}

export interface WormJournal<T = Record<string, unknown>> {
  append(event: T): Promise<void>;
}

export interface TradeOSDependencies {
  clientOS: ClientOSGateway;
  complianceOS: ComplianceOSGateway;
  custodySync: CustodySyncGateway;
  surveillanceHub: SurveillanceHubGateway;
  regDesk: RegDeskGateway;
  feeForge: FeeForgeGateway;
  worm: WormJournal;
  adapters: RoutingAdapters;
}

export type WormEvent = {
  type:
    | "order.created"
    | "order.held"
    | "order.cancelled"
    | "order.execution"
    | "block.built"
    | "block.routed"
    | "block.allocated"
    | "pretrade.check"
    | "bestex.recorded"
    | "trade_error.opened"
    | "trade_error.closed"
    | "confirm.generated"
    | "blotter.export";
  timestamp: string;
  data: Record<string, unknown>;
};

export interface AllocationPostResult {
  allocations: Allocation[];
}

export interface PreTradeCheckDependencies {
  clientOS: ClientOSGateway;
  complianceOS: ComplianceOSGateway;
  custodySync: CustodySyncGateway;
  surveillanceHub: SurveillanceHubGateway;
  feeForge: FeeForgeGateway;
  worm: WormJournal;
}

export interface RoutingDependencies {
  custodySync: CustodySyncGateway;
  complianceOS: ComplianceOSGateway;
  clientOS: ClientOSGateway;
  worm: WormJournal;
}

export interface TradeErrorDependencies {
  custodySync: CustodySyncGateway;
  complianceOS: ComplianceOSGateway;
  worm: WormJournal;
}

export interface ConfirmDependencies {
  regDesk: RegDeskGateway;
  worm: WormJournal;
}

export type VenueAdapter = (input: {
  block: Block;
}) => Promise<Execution[]>;

export interface CryptoRoutingAdapters {
  rfq: (input: { block: Block; maxSlippageBps: number }) => Promise<{ execution: Execution; quotes: Array<{ venue: string; price: Decimal }> }>;
  dex: (input: { block: Block; maxSlippageBps: number }) => Promise<{ execution: Execution; route: string }>;
}

export interface RoutingAdapters {
  equity: VenueAdapter;
  etf: VenueAdapter;
  mutualFund: VenueAdapter;
  options: VenueAdapter;
  bond: VenueAdapter;
  crypto: CryptoRoutingAdapters;
}

export interface RoutingContext {
  adapters: RoutingAdapters;
  custodySync: CustodySyncGateway;
  complianceOS: ComplianceOSGateway;
  clientOS: ClientOSGateway;
  worm: WormJournal;
}

export interface AllocationDependencies {
  custodySync: CustodySyncGateway;
  worm: WormJournal;
}

