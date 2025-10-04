import { Decimal } from 'decimal.js';
import { DateTime } from 'luxon';
import type { Transaction } from '@blackroad/db';

export interface Lot {
  quantity: Decimal;
  cost: Decimal;
  openDate: DateTime;
  closedDate?: DateTime;
}

export interface CostBasisResult {
  lots: Lot[];
  realizedPnl: Decimal;
  unrealizedCost: Decimal;
}

type Method = 'FIFO' | 'LIFO' | 'SPEC_ID' | 'AVERAGE';

interface BuildLotsOptions {
  transactions: Transaction[];
  method: Method;
  asOf: Date;
}

function isBuyType(tx: Transaction): boolean {
  return ['BUY', 'TRANSFER_IN', 'CONTRIB', 'PREMIUM', 'STAKING_REWARD'].includes(tx.type);
}

function isSellType(tx: Transaction): boolean {
  return ['SELL', 'TRANSFER_OUT', 'DIST', 'CLAIM', 'CLAIM_PAID'].includes(tx.type);
}

export function buildLots({ transactions, method, asOf }: BuildLotsOptions): CostBasisResult {
  const sorted = [...transactions].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
  const openLots: Lot[] = [];
  const closedLots: Lot[] = [];
  let runningQuantity = new Decimal(0);
  let realized = new Decimal(0);

  if (method === 'AVERAGE') {
    let totalCost = new Decimal(0);
    sorted.forEach((tx) => {
      if (!tx.quantity) return;
      const qty = new Decimal(tx.quantity.toString());
      const amount = new Decimal(tx.netAmount.toString());
      if (isBuyType(tx)) {
        runningQuantity = runningQuantity.plus(qty);
        totalCost = totalCost.plus(amount);
      } else if (isSellType(tx)) {
        const avgCost = runningQuantity.equals(0) ? new Decimal(0) : totalCost.dividedBy(runningQuantity);
        runningQuantity = runningQuantity.minus(qty.abs());
        totalCost = avgCost.times(runningQuantity.max(0));
        const proceeds = amount.negated();
        realized = realized.plus(proceeds.minus(avgCost.times(qty.abs())));
      }
    });
    openLots.push({
      quantity: runningQuantity,
      cost: runningQuantity.equals(0) ? new Decimal(0) : runningQuantity.times(totalCost.dividedBy(runningQuantity)),
      openDate: DateTime.fromJSDate(asOf)
    });
    return {
      lots: [...closedLots, ...openLots],
      realizedPnl: realized,
      unrealizedCost: totalCost
    };
  }

  const pickLot = (qty: Decimal) => {
    if (method === 'FIFO') {
      return openLots.find((lot) => lot.quantity.greaterThan(0));
    }
    if (method === 'LIFO') {
      return [...openLots].reverse().find((lot) => lot.quantity.greaterThan(0));
    }
    return undefined;
  };

  for (const tx of sorted) {
    if (!tx.quantity) continue;
    const qty = new Decimal(tx.quantity.toString());
    const amount = new Decimal(tx.netAmount.toString());
    const tradeDate = DateTime.fromJSDate(tx.tradeDate);

    if (isBuyType(tx)) {
      openLots.push({
        quantity: qty,
        cost: amount,
        openDate: tradeDate
      });
      runningQuantity = runningQuantity.plus(qty);
    } else if (isSellType(tx)) {
      let remaining = qty.abs();
      while (remaining.greaterThan(0)) {
        let lot: Lot | undefined;
        if (method === 'SPEC_ID') {
          const selected = (tx.meta as any)?.selectedLotIds as string[] | undefined;
          if (!selected || selected.length === 0) {
            throw new Error('SPEC_ID method requires meta.selectedLotIds');
          }
          lot = openLots.find((l) => selected.includes((l as any).id));
        } else {
          lot = pickLot(remaining);
        }
        if (!lot) {
          throw new Error('Unable to locate lot for sale');
        }
        const takeQty = Decimal.min(remaining, lot.quantity);
        const lotCostPerShare = lot.cost.dividedBy(lot.quantity);
        lot.quantity = lot.quantity.minus(takeQty);
        lot.cost = lot.quantity.equals(0) ? new Decimal(0) : lotCostPerShare.times(lot.quantity);
        runningQuantity = runningQuantity.minus(takeQty);
        const proceeds = amount.dividedBy(qty.abs()).times(takeQty).negated();
        realized = realized.plus(proceeds.minus(lotCostPerShare.times(takeQty)));
        if (lot.quantity.equals(0)) {
          lot.closedDate = tradeDate;
          closedLots.push(lot);
        }
        remaining = remaining.minus(takeQty);
      }
    }
  }

  const unrealizedCost = openLots.reduce((acc, lot) => acc.plus(lot.cost), new Decimal(0));

  return {
    lots: [...closedLots, ...openLots],
    realizedPnl: realized,
    unrealizedCost
  };
}
