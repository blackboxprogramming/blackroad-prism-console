import { Decimal } from "decimal.js";
import { z } from "zod";
import {
  Order,
  OrderInput,
  PreTradeCheckDependencies,
  PreTradeResult,
  WormEvent,
} from "./types.js";
import { createWormEvent } from "./journal.js";

const orderInputSchema = z.object({
  clientId: z.string(),
  accountId: z.string(),
  traderId: z.string(),
  side: z.string(),
  instrumentId: z.string(),
  assetClass: z.string(),
  qty: z.union([z.string(), z.number(), z.instanceof(Decimal)]),
  priceType: z.string(),
  limitPrice: z.union([z.string(), z.number(), z.instanceof(Decimal)]).optional().nullable(),
  timeInForce: z.string(),
  routePref: z.string().optional().nullable(),
  meta: z.record(z.any()).optional(),
});

export class PreTradeCheckService {
  constructor(private readonly deps: PreTradeCheckDependencies) {}

  async hydrate(input: OrderInput & { id: string; createdAt: Date }): Promise<Order> {
    const parsed = orderInputSchema.parse(input);
    return {
      ...parsed,
      qty: new Decimal(parsed.qty),
      limitPrice: parsed.limitPrice == null ? undefined : new Decimal(parsed.limitPrice),
      status: "NEW",
      id: input.id,
      createdAt: input.createdAt,
      executions: [],
    } satisfies Order;
  }

  async evaluate(order: Order): Promise<PreTradeResult> {
    const reasons: string[] = [];
    const warnings: string[] = [];

    const gates = await this.deps.clientOS.getAccountGates(order.accountId);
    if (!gates.kycCleared) {
      reasons.push("KYC not cleared");
    }
    if (!gates.amlCleared) {
      reasons.push("AML not cleared");
    }
    if (!gates.suitability) {
      reasons.push("Suitability check failed");
    }
    if (order.assetClass === "OPTION" && gates.optionsLevel < (order.meta?.requiredOptionsLevel as number | undefined ?? 2)) {
      reasons.push("Options level insufficient");
    }
    if ((order.side === "SELL_SHORT" || order.side === "SELL") && !gates.marginApproved) {
      warnings.push("Margin not approved; order may fail locate");
    }

    const compliance = await this.deps.complianceOS.getSnapshot(order.accountId, order.instrumentId);
    if (compliance.marketingHold) {
      reasons.push("Account on marketing hold");
    }
    if (compliance.amlFlag) {
      reasons.push("Account AML flagged");
    }
    if (compliance.requiresU4Amendment) {
      warnings.push("Rep pending U4 amendment");
    }

    const restricted = await this.deps.complianceOS.isSymbolRestricted(order.instrumentId, new Date());
    if (restricted.restricted) {
      reasons.push(`Restricted symbol: ${restricted.reason ?? "policy"}`);
    }

    const insider = await this.deps.surveillanceHub.isInsider(order.accountId, order.instrumentId);
    if (insider) {
      reasons.push("Surveillance flagged insider");
    }

    const custody = await this.deps.custodySync.getSnapshot(order.accountId, order.instrumentId);
    if (order.side.startsWith("SELL") || order.side === "SELL_TO_CLOSE") {
      const position = custody.positions[order.instrumentId] ?? new Decimal(0);
      if (position.lessThan(order.qty)) {
        reasons.push("Insufficient position");
      }
    } else {
      const requiredCash = this.estimateNotional(order);
      if (custody.cash.lessThan(requiredCash)) {
        reasons.push("Insufficient cash");
      }
    }

    if (order.meta?.lotMethod === "SPEC_ID" && Array.isArray(order.meta.lots)) {
      const requestedLots = (order.meta.lots as string[]).length;
      const availableLots = custody.lots[order.instrumentId]?.length ?? 0;
      if (requestedLots === 0 || availableLots < requestedLots) {
        reasons.push("Specified lots unavailable");
      }
    }

    if (order.meta?.washSaleCandidate === true && order.side.startsWith("SELL")) {
      warnings.push("Potential wash sale");
    }

    if (order.assetClass === "MUTUAL_FUND") {
      const mfRules = await this.deps.feeForge.getMutualFundRules(order.instrumentId);
      if (mfRules.popOnly && order.priceType !== "MKT") {
        reasons.push("Mutual fund must trade at POP");
      }
      if (!mfRules.breakpointEligible && order.meta?.breakpointRequest === true) {
        warnings.push("Breakpoint requested but ineligible");
      }
    }

    if (order.assetClass === "CRYPTO") {
      const wallet = (order.meta?.walletAddress as string | undefined) ?? "";
      if (!wallet) {
        reasons.push("Crypto wallet missing");
      } else {
        const verified = await this.deps.clientOS.verifyWallet(order.accountId, wallet);
        if (!verified) {
          reasons.push("Wallet not whitelisted");
        }
      }
    }

    const event: WormEvent = createWormEvent("pretrade.check", {
      orderId: order.id,
      accountId: order.accountId,
      reasons,
      warnings,
    });
    await this.deps.worm.append(event);

    return {
      passed: reasons.length === 0,
      reasons,
      warnings,
      gated: reasons.length > 0,
    };
  }

  private estimateNotional(order: Order): Decimal {
    if (order.priceType === "MKT") {
      const hint = order.meta?.estimatedPrice as number | string | undefined;
      if (hint) {
        return new Decimal(hint).times(order.qty);
      }
    }
    if (order.limitPrice) {
      return order.limitPrice.times(order.qty);
    }
    return new Decimal(order.meta?.notionalHint as number | string | undefined ?? 0).times(order.qty);
  }
}
