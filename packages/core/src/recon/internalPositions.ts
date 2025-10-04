import { Decimal } from 'decimal.js';
import type { Transaction } from '@blackroad/db';

function applyQuantity(total: Decimal, tx: Transaction): Decimal {
  if (!tx.quantity) return total;
  const qty = new Decimal(tx.quantity.toString());
  switch (tx.type) {
    case 'BUY':
    case 'TRANSFER_IN':
    case 'CONTRIB':
    case 'PREMIUM':
    case 'STAKING_REWARD':
      return total.plus(qty);
    case 'SELL':
    case 'TRANSFER_OUT':
    case 'DIST':
    case 'CLAIM':
    case 'CLAIM_PAID':
      return total.minus(qty.abs());
    default:
      return total;
  }
}

export function deriveInternalPositions(
  transactions: Transaction[],
  asOf: Date
): Map<string, Decimal> {
  const map = new Map<string, Decimal>();
  const filtered = transactions.filter((tx) => tx.tradeDate.getTime() <= asOf.getTime());
  for (const tx of filtered) {
    if (!tx.instrumentId) continue;
    const prev = map.get(tx.instrumentId) ?? new Decimal(0);
    map.set(tx.instrumentId, applyQuantity(prev, tx));
  }
  return map;
}

export function deriveInternalCash(transactions: Transaction[], asOf: Date): Map<string, Decimal> {
  const map = new Map<string, Decimal>();
  const filtered = transactions.filter((tx) => tx.tradeDate.getTime() <= asOf.getTime());
  for (const tx of filtered) {
    const currency = tx.currency ?? 'USD';
    const prev = map.get(currency) ?? new Decimal(0);
    const amount = new Decimal(tx.netAmount.toString());
    map.set(currency, prev.plus(amount));
  }
  return map;
}
