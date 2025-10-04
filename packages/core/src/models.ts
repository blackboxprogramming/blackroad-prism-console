import { Decimal } from 'decimal.js';
import { DateTime } from 'luxon';
import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  custodian: z.string(),
  accountNo: z.string(),
  type: z.enum(['TAXABLE', 'IRA', 'QUALIFIED', 'INSURANCE', 'CRYPTO_WALLET']),
  baseCurrency: z.string().length(3),
  openedAt: z.coerce.date().optional(),
  closedAt: z.coerce.date().optional(),
  meta: z.record(z.any()).default({})
});

export type AccountModel = z.infer<typeof accountSchema>;

export const instrumentSchema = z.object({
  id: z.string(),
  symbol: z.string().nullable(),
  cusip: z.string().nullable(),
  isin: z.string().nullable(),
  ticker: z.string().nullable(),
  kind: z.enum(['EQUITY', 'ETF', 'MUTUAL_FUND', 'OPTION', 'BOND', 'CASH', 'INS_TOKEN', 'CRYPTO']),
  cryptoChain: z.string().nullable(),
  decimals: z.number().int().nonnegative().nullable(),
  meta: z.record(z.any()).default({})
});

export type InstrumentModel = z.infer<typeof instrumentSchema>;

export const transactionSchema = z.object({
  id: z.string().optional(),
  accountId: z.string(),
  instrumentId: z.string().nullable().optional(),
  tradeDate: z.coerce.date(),
  settleDate: z.coerce.date().nullable().optional(),
  type: z.enum([
    'BUY',
    'SELL',
    'DIV',
    'INT',
    'FEE',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'CONTRIB',
    'DIST',
    'CLAIM',
    'PREMIUM',
    'CLAIM_PAID',
    'STAKING_REWARD'
  ]),
  quantity: z.coerce.number().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  grossAmount: z.coerce.number(),
  netAmount: z.coerce.number(),
  currency: z.string().length(3),
  externalId: z.string().optional().nullable(),
  source: z.enum(['CUSTODIAN', 'EXCHANGE', 'CHAIN', 'MANUAL']),
  meta: z.record(z.any()).default({})
});

export type TransactionModel = z.infer<typeof transactionSchema>;

export interface ReconDelta {
  key: string;
  scope: 'POSITION' | 'CASH' | 'TRADE' | 'COST_BASIS';
  internal: Decimal | null;
  external: Decimal | null;
  asOf: DateTime;
}

export const reconBreakStatus = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'WAIVED'] as const;
export type ReconBreakStatus = (typeof reconBreakStatus)[number];

export interface StatementContext {
  accountId: string;
  period: string;
  documentPath: string;
}

export const documentKinds = [
  'CONFIRM',
  'STATEMENT',
  'ADVICE',
  'KYC',
  'CUSTODIAN_FEED',
  'PROOF_OF_RESERVES'
] as const;

export type DocumentKind = (typeof documentKinds)[number];

export interface ProofOfReservesMeta {
  asOf: string;
  provider: string;
  referenceUrl?: string;
}

export const epsilon = new Decimal('0.0001');

export function normalizeQuantity(value: Decimal.Value, decimals = 4): Decimal {
  return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}
