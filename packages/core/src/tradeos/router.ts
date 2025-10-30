import { RoutingContext, Block, Order, RoutingDecision, Execution } from "./types.js";
import { createWormEvent } from "./journal.js";

export class RoutingEngine {
  constructor(private readonly ctx: RoutingContext) {}

  async route(block: Block, orders: Order[], venue: string): Promise<RoutingDecision> {
    if (block.executions.length > 0) {
      return { venue: block.executions[0]?.venue ?? venue, executions: block.executions };
    }

    await this.assertCoolingOff(block, orders);

    let executions: Execution[] = [];

    switch (block.assetClass) {
      case "EQUITY":
        executions = await this.ctx.adapters.equity({ block });
        break;
      case "ETF":
        executions = await this.ctx.adapters.etf({ block });
        break;
      case "OPTION":
        executions = await this.ctx.adapters.options({ block });
        break;
      case "BOND":
        executions = await this.ctx.adapters.bond({ block });
        break;
      case "MUTUAL_FUND":
        executions = await this.ctx.adapters.mutualFund({ block });
        break;
      case "CRYPTO": {
        const maxSlippageBps = (orders[0]?.meta?.maxSlippageBps as number | undefined) ?? 50;
        if (venue.startsWith("RFQ:")) {
          const rfqVenue = await this.ctx.adapters.crypto.rfq({ block, maxSlippageBps });
          executions = [rfqVenue.execution];
        } else if (venue.startsWith("DEX:")) {
          const dexVenue = await this.ctx.adapters.crypto.dex({ block, maxSlippageBps });
          executions = [dexVenue.execution];
        } else {
          throw new Error(`Unknown crypto venue selection: ${venue}`);
        }
        break;
      }
      default:
        throw new Error(`Unsupported asset class: ${block.assetClass}`);
    }

    for (const exec of executions) {
      await this.ctx.worm.append(
        createWormEvent("order.execution", {
          blockId: block.id,
          executionId: exec.id,
          venue: exec.venue,
          qty: exec.qty.toString(),
          price: exec.price.toString(),
        }),
      );
    }

    block.executions = executions;

    await this.ctx.worm.append(
      createWormEvent("block.routed", {
        blockId: block.id,
        venue,
        executionCount: executions.length,
      }),
    );

    return { venue, executions };
  }

  private async assertCoolingOff(block: Block, orders: Order[]): Promise<void> {
    const now = new Date();
    for (const order of orders) {
      const snapshot = await this.ctx.complianceOS.getSnapshot(order.accountId, block.instrumentId);
      const window = snapshot.ipoCoolingOff[block.instrumentId];
      if (window && now < window.effectiveDate) {
        const mode = (order.meta?.primaryMarketMode as string | undefined)?.toUpperCase();
        if (mode === "IOI" || mode === "TOMBSTONE") {
          continue;
        }
        throw new Error(`IPO cooling-off in effect for ${block.instrumentId}`);
      }
      const restricted = snapshot.restrictedSymbols.has(block.instrumentId);
      if (restricted) {
        throw new Error(`Instrument ${block.instrumentId} restricted for account ${order.accountId}`);
      }
    }
  }
}
