import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import {
  Allocation,
  AllocationDependencies,
  AllocationMethod,
  AllocationPostResult,
  Block,
  Order,
  WormJournal,
} from "./types.js";
import { createWormEvent } from "./journal.js";

export class AllocationEngine {
  constructor(private readonly deps: AllocationDependencies) {}

  async allocate(
    block: Block,
    orders: Order[],
    method: AllocationMethod = "PRO_RATA",
  ): Promise<AllocationPostResult> {
    if (block.executions.length === 0) {
      throw new Error("Cannot allocate without executions");
    }

    const totalFill = block.executions.reduce((acc, exec) => acc.plus(exec.qty), new Decimal(0));
    const totalOrderQty = orders.reduce((acc, order) => acc.plus(order.qty), new Decimal(0));
    if (totalOrderQty.isZero()) {
      throw new Error("Zero quantity orders cannot be allocated");
    }

    const weightedPrice = block.executions.reduce((acc, exec) => acc.plus(exec.price.times(exec.qty)), new Decimal(0)).div(totalFill);

    const allocations: Allocation[] = [];
    let remainder = totalFill;

    for (const [index, order] of orders.entries()) {
      let allocationQty: Decimal;
      if (method === "ROUND_LOT") {
        allocationQty = totalFill.times(order.qty).div(totalOrderQty).toDecimalPlaces(0, Decimal.ROUND_FLOOR);
      } else {
        allocationQty = totalFill.times(order.qty).div(totalOrderQty).toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
      }

      if (index === orders.length - 1) {
        allocationQty = remainder;
      }
      remainder = remainder.minus(allocationQty);

      const allocation: Allocation = {
        id: randomUUID(),
        blockId: block.id,
        accountId: order.accountId,
        qty: allocationQty,
        avgPrice: weightedPrice,
        method,
        status: "POSTED",
        meta: {
          orderId: order.id,
        },
      };
      allocations.push(allocation);

      const direction = order.side.startsWith("SELL") ? -1 : 1;
      const quantitySigned = allocationQty.times(direction);
      const cashDelta = weightedPrice.times(quantitySigned).times(-1);

      await this.deps.custodySync.updatePosition({
        accountId: order.accountId,
        instrumentId: block.instrumentId,
        quantity: quantitySigned,
        avgPrice: weightedPrice,
        cashDelta,
      });
    }

    await this.deps.worm.append(
      createWormEvent("block.allocated", {
        blockId: block.id,
        method,
        allocationCount: allocations.length,
      }),
    );

    return { allocations };
  }
}
