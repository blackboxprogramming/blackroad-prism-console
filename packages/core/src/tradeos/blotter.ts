import { createHash } from "node:crypto";
import { DateTime } from "luxon";
import { Decimal } from "decimal.js";
import { BlotterExportResult, BlotterRow, Order, WormJournal } from "./types.js";
import { createWormEvent } from "./journal.js";

export interface BlotterFilter {
  from?: Date;
  to?: Date;
  accountId?: string;
}

export class BlotterService {
  constructor(private readonly worm: WormJournal) {}

  async export(orders: Order[], filter: BlotterFilter, outPath: string): Promise<BlotterExportResult> {
    const rows: BlotterRow[] = orders
      .filter((order) => this.applyFilter(order, filter))
      .map((order) => ({
        orderId: order.id,
        accountId: order.accountId,
        instrumentId: order.instrumentId,
        side: order.side,
        qty: this.totalQty(order),
        avgPrice: this.computeAvgPrice(order),
        status: order.status,
        ts: order.createdAt,
      }));

    const serializable = rows.map((row) => ({
      ...row,
      qty: row.qty.toString(),
      avgPrice: row.avgPrice.toString(),
      ts: row.ts.toISOString(),
    }));

    const content = JSON.stringify(serializable, null, 2);
    const sha256 = createHash("sha256").update(content).digest("hex");

    await this.worm.append(
      createWormEvent("blotter.export", {
        path: outPath,
        sha256,
        rowCount: rows.length,
      }),
    );

    return {
      path: outPath,
      sha256,
      rows,
    };
  }

  private applyFilter(order: Order, filter: BlotterFilter): boolean {
    if (filter.accountId && order.accountId !== filter.accountId) {
      return false;
    }
    const from = filter.from ? DateTime.fromJSDate(filter.from) : null;
    const to = filter.to ? DateTime.fromJSDate(filter.to) : null;
    const created = DateTime.fromJSDate(order.createdAt);
    if (from && created < from) {
      return false;
    }
    if (to && created > to) {
      return false;
    }
    return true;
  }

  private totalQty(order: Order): Decimal {
    if (order.executions.length === 0) {
      return new Decimal(order.qty);
    }
    return order.executions.reduce((acc, exec) => acc.plus(exec.qty), new Decimal(0));
  }

  private computeAvgPrice(order: Order): Decimal {
    if (order.executions.length === 0) {
      return order.limitPrice ?? new Decimal(0);
    }
    const totalQty = this.totalQty(order);
    const weighted = order.executions.reduce((acc, exec) => acc.plus(exec.price.times(exec.qty)), new Decimal(0));
    return totalQty.isZero() ? new Decimal(0) : weighted.div(totalQty);
  }
}
