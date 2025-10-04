import { Decimal } from 'decimal.js';
import type { CashLedger, PositionSnapshot, Transaction } from '@blackroad/db';
import { DateTime } from 'luxon';
import { epsilon } from '../models.js';
import { buildLots } from './costBasis.js';

export interface PositionBreakInput {
  accountId: string;
  asOf: Date;
  external: PositionSnapshot[];
  internal: PositionSnapshot[];
}

export interface CashBreakInput {
  accountId: string;
  asOf: Date;
  external: CashLedger[];
  internal: CashLedger[];
}

export interface TradeBreakInput {
  accountId: string;
  asOf: Date;
  external: Transaction[];
  internal: Transaction[];
}

export interface CostBasisBreakInput {
  accountId: string;
  asOf: Date;
  transactions: Transaction[];
  method: 'FIFO' | 'LIFO' | 'SPEC_ID' | 'AVERAGE';
  externalLots?: { quantity: Decimal; cost: Decimal }[];
}

export interface ReconBreakDraft {
  key: string;
  scope: 'POSITION' | 'CASH' | 'TRADE' | 'COST_BASIS';
  internal: Decimal | null;
  external: Decimal | null;
  asOf: Date;
  severity: number;
  notes?: string;
}

function computeSeverity(scope: ReconBreakDraft['scope'], delta: Decimal): number {
  const absolute = delta.abs();
  if (scope === 'POSITION' || scope === 'CASH') {
    if (absolute.greaterThan(1000)) return 90;
    if (absolute.greaterThan(100)) return 80;
    if (absolute.greaterThan(10)) return 60;
    return 40;
  }
  if (scope === 'TRADE') {
    if (absolute.greaterThan(1000)) return 70;
    if (absolute.greaterThan(100)) return 60;
    return 40;
  }
  return absolute.greaterThan(100) ? 50 : 30;
}

function groupByKey<T extends { instrumentId?: string | null; currency?: string }>(
  rows: T[],
  scope: 'POSITION' | 'CASH'
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = scope === 'POSITION' ? (row.instrumentId ?? 'UNKNOWN') : (row.currency ?? 'USD');
    const bucket = map.get(key) ?? [];
    bucket.push(row);
    map.set(key, bucket);
  }
  return map;
}

export function buildPositionBreaks(input: PositionBreakInput): ReconBreakDraft[] {
  const results: ReconBreakDraft[] = [];
  const internalMap = groupByKey(input.internal, 'POSITION');
  const externalMap = groupByKey(input.external, 'POSITION');
  const keys = new Set([...internalMap.keys(), ...externalMap.keys()]);
  for (const key of keys) {
    const internal = internalMap.get(key)?.reduce((acc, snapshot) => acc.plus(snapshot.quantity), new Decimal(0)) ?? new Decimal(0);
    const external = externalMap.get(key)?.reduce((acc, snapshot) => acc.plus(snapshot.quantity), new Decimal(0)) ?? new Decimal(0);
    const delta = internal.minus(external);
    if (delta.abs().greaterThan(epsilon)) {
      results.push({
        key,
        scope: 'POSITION',
        internal,
        external,
        asOf: input.asOf,
        severity: computeSeverity('POSITION', delta)
      });
    }
  }
  return results;
}

export function buildCashBreaks(input: CashBreakInput): ReconBreakDraft[] {
  const results: ReconBreakDraft[] = [];
  const internalMap = groupByKey(input.internal, 'CASH');
  const externalMap = groupByKey(input.external, 'CASH');
  const keys = new Set([...internalMap.keys(), ...externalMap.keys()]);
  for (const key of keys) {
    const internal = internalMap.get(key)?.reduce((acc, ledger) => acc.plus(ledger.balance), new Decimal(0)) ?? new Decimal(0);
    const external = externalMap.get(key)?.reduce((acc, ledger) => acc.plus(ledger.balance), new Decimal(0)) ?? new Decimal(0);
    const delta = internal.minus(external);
    if (delta.abs().greaterThan(epsilon)) {
      results.push({
        key,
        scope: 'CASH',
        internal,
        external,
        asOf: input.asOf,
        severity: computeSeverity('CASH', delta)
      });
    }
  }
  return results;
}

export function buildTradeBreaks(input: TradeBreakInput): ReconBreakDraft[] {
  const results: ReconBreakDraft[] = [];
  const keyed = (tx: Transaction) => tx.externalId ?? `${tx.type}-${tx.tradeDate.toISOString()}-${tx.instrumentId ?? 'N/A'}`;
  const internalMap = new Map<string, Transaction>();
  const externalMap = new Map<string, Transaction>();
  input.internal.forEach((tx) => internalMap.set(keyed(tx), tx));
  input.external.forEach((tx) => externalMap.set(keyed(tx), tx));
  const keys = new Set([...internalMap.keys(), ...externalMap.keys()]);
  for (const key of keys) {
    const internal = internalMap.get(key);
    const external = externalMap.get(key);
    if (!internal || !external) {
      const delta = new Decimal(internal?.netAmount?.toString() ?? external?.netAmount?.toString() ?? '0');
      if (delta.abs().greaterThan(epsilon)) {
        results.push({
          key,
          scope: 'TRADE',
          internal: internal ? new Decimal(internal.netAmount.toString()) : null,
          external: external ? new Decimal(external.netAmount.toString()) : null,
          asOf: input.asOf,
          severity: computeSeverity('TRADE', delta),
          notes: internal ? 'Internal unmatched trade' : 'External unmatched trade'
        });
      }
    }
  }
  return results;
}

export function buildCostBasisBreaks(input: CostBasisBreakInput): ReconBreakDraft[] {
  const lots = buildLots({ transactions: input.transactions, method: input.method, asOf: input.asOf });
  const internalCost = lots.unrealizedCost;
  const externalCost = input.externalLots?.reduce((acc, lot) => acc.plus(lot.cost), new Decimal(0)) ?? null;
  const delta = externalCost ? internalCost.minus(externalCost) : new Decimal(0);
  if (externalCost && delta.abs().greaterThan(epsilon)) {
    return [
      {
        key: 'COST_BASIS',
        scope: 'COST_BASIS',
        internal: internalCost,
        external: externalCost,
        asOf: input.asOf,
        severity: computeSeverity('COST_BASIS', delta)
      }
    ];
  }
  return [];
}

export function escalateAgedBreaks(breaks: ReconBreakDraft[], now: Date = new Date()): ReconBreakDraft[] {
  const list: ReconBreakDraft[] = [];
  const nowDate = DateTime.fromJSDate(now);
  for (const item of breaks) {
    const ageDays = nowDate.diff(DateTime.fromJSDate(item.asOf), 'days').days;
    if ((item.scope === 'POSITION' || item.scope === 'CASH') && ageDays > 2 && item.severity >= 80) {
      list.push({ ...item, notes: 'Auto escalated: aged > T+2' });
    }
  }
  return list;
}
