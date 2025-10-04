import type { PositionSnapshot, CashLedger, Transaction } from '@blackroad/db';

export interface CustodianAdapter {
  importPositions(params: { date: Date; accountId: string; files: string[] }): Promise<PositionSnapshot[]>;
  importCash(params: { date: Date; accountId: string; files: string[] }): Promise<CashLedger[]>;
  importTransactions(params: { from: Date; to: Date; accountId: string; files: string[] }): Promise<Transaction[]>;
}

export interface ExchangeAdapter {
  importFills(params: { from: Date; to: Date; accountId: string; files: string[] }): Promise<Transaction[]>;
}

export interface OnChainAdapter {
  fetchBalances(params: { blockTag: string; wallet: string }): Promise<PositionSnapshot[]>;
  fetchTransfers(params: { from: Date; to: Date; wallet: string }): Promise<Transaction[]>;
}

export interface PricingAdapter {
  getPrice(params: { instrumentId: string; asOf: Date; currency: string }): Promise<string>;
}
