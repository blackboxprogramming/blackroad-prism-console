import { createHash } from "node:crypto";
import { Decimal } from "decimal.js";
import { Confirm, ConfirmDependencies, Execution, Order } from "./types.js";
import { createWormEvent } from "./journal.js";

export class ConfirmService {
  constructor(private readonly deps: ConfirmDependencies) {}

  async generate(order: Order, executions: Execution[]): Promise<Confirm> {
    if (executions.length === 0) {
      throw new Error("No executions available for confirm generation");
    }

    const totalQty = executions.reduce((acc, exec) => acc.plus(exec.qty), new Decimal(0));
    const weightedPrice = executions
      .reduce((acc, exec) => acc.plus(exec.price.times(exec.qty)), new Decimal(0))
      .div(totalQty);

    const payload = JSON.stringify({ orderId: order.id, executions: executions.map((e) => e.execId) });
    const sha256 = createHash("sha256").update(payload).digest("hex");

    const confirm: Confirm = {
      id: `CONF-${order.id}`,
      orderId: order.id,
      accountId: order.accountId,
      instrumentId: order.instrumentId,
      side: order.side,
      qty: totalQty,
      avgPrice: weightedPrice,
      fees: executions[0]?.fees,
      ts: new Date(),
      path: `/confirms/${order.id}.pdf`,
      sha256,
    };

    await this.deps.regDesk.logConfirm(confirm);
    await this.deps.worm.append(
      createWormEvent("confirm.generated", {
        orderId: order.id,
        confirmId: confirm.id,
        sha256,
      }),
    );

    return confirm;
  }
}
