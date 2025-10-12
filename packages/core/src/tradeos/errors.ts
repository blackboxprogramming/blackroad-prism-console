import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import {
  Execution,
  Order,
  TradeErrorDependencies,
  TradeErrorItem,
  TradeErrorStatus,
  TradeErrorType,
} from "./types.js";
import { createWormEvent } from "./journal.js";

export interface TradeErrorOpenInput {
  order?: Order;
  execution?: Execution;
  type: TradeErrorType;
  notes?: string;
  correctedPrice?: Decimal;
}

export interface TradeErrorCloseInput {
  approverIds: string[];
  status?: Extract<TradeErrorStatus, "Corrected" | "ClientCompensated" | "Closed">;
  notes?: string;
}

export class TradeErrorService {
  private readonly errors = new Map<string, TradeErrorItem>();

  constructor(private readonly deps: TradeErrorDependencies) {}

  async open(input: TradeErrorOpenInput): Promise<TradeErrorItem> {
    const id = randomUUID();
    const segregationAccountId = `SEG-${input.order?.accountId ?? input.execution?.orderId ?? "GEN"}`;
    const pnl = this.computePnl(input);

    const item: TradeErrorItem = {
      id,
      orderId: input.order?.id,
      executionId: input.execution?.id,
      type: input.type,
      status: "Segregated",
      segregationAccountId,
      pnl,
      notes: input.notes,
      createdAt: new Date(),
      approvals: [],
    };
    this.errors.set(id, item);

    await this.deps.worm.append(
      createWormEvent("trade_error.opened", {
        tradeErrorId: id,
        orderId: item.orderId,
        executionId: item.executionId,
        type: item.type,
        pnl: pnl?.toString(),
      }),
    );

    return item;
  }

  async close(id: string, input: TradeErrorCloseInput): Promise<TradeErrorItem> {
    const item = this.errors.get(id);
    if (!item) {
      throw new Error(`Trade error ${id} not found`);
    }
    const uniqueApprovers = new Set(input.approverIds);
    if (uniqueApprovers.size < 2) {
      throw new Error("Trade error closure requires two distinct approvals");
    }
    item.status = input.status ?? "Closed";
    item.closedAt = new Date();
    item.approvals = Array.from(uniqueApprovers);
    item.notes = input.notes ?? item.notes;

    await this.deps.worm.append(
      createWormEvent("trade_error.closed", {
        tradeErrorId: id,
        approvals: item.approvals,
        status: item.status,
      }),
    );

    return item;
  }

  list(): TradeErrorItem[] {
    return [...this.errors.values()];
  }

  private computePnl(input: TradeErrorOpenInput): Decimal | undefined {
    if (!input.execution || !input.correctedPrice) {
      return undefined;
    }
    const direction = input.order?.side?.startsWith("SELL") ? -1 : 1;
    const priceDiff = input.execution.price.minus(input.correctedPrice);
    return priceDiff.times(input.execution.qty).times(direction);
  }
}
