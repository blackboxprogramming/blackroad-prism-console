import { randomUUID } from "node:crypto";
import {
  ScenarioContext,
  SurveillanceAlert,
  defaultScenarioPolicies,
  minutesBetween,
  TradeRecord,
} from "../types.js";

function sameHousehold(a: TradeRecord, b: TradeRecord): boolean {
  return Boolean(a.householdId && a.householdId === b.householdId);
}

export function detectWashTrades(context: ScenarioContext): SurveillanceAlert[] {
  const policies = { ...defaultScenarioPolicies, ...context.policies };
  const alerts: SurveillanceAlert[] = [];
  const trades = [...context.trades].sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());

  for (let i = 0; i < trades.length; i += 1) {
    const trade = trades[i];
    if (trade.side !== "BUY" && trade.side !== "SELL") continue;
    for (let j = i + 1; j < trades.length; j += 1) {
      const candidate = trades[j];
      if (candidate.symbol !== trade.symbol) continue;
      if (candidate.accountId !== trade.accountId && !sameHousehold(trade, candidate)) {
        continue;
      }
      if (minutesBetween(trade.executedAt, candidate.executedAt) > policies.washTradeLookbackMinutes) {
        break;
      }
      if (trade.side === candidate.side) continue;
      const minQty = Math.min(trade.quantity, candidate.quantity);
      if (minQty < policies.washTradeMinQuantity) continue;

      const keyParts = [trade.accountId, trade.symbol, trade.executedAt.toISOString(), candidate.executedAt.toISOString()]
        .sort();
      const key = keyParts.join("|");
      const signal = {
        accountIds: [trade.accountId, candidate.accountId],
        householdId: trade.householdId ?? candidate.householdId ?? null,
        symbol: trade.symbol,
        firstTradeId: trade.id,
        secondTradeId: candidate.id,
        sides: [trade.side, candidate.side],
        quantities: [trade.quantity, candidate.quantity],
        executedAt: [trade.executedAt.toISOString(), candidate.executedAt.toISOString()],
        lookbackMinutes: policies.washTradeLookbackMinutes,
      };
      alerts.push({
        id: randomUUID(),
        kind: "TRADE",
        scenario: "WASH_TRADE",
        severity: 85,
        status: "Open",
        key,
        signal,
        createdAt: new Date(),
      });
      break;
    }
  }

  return alerts;
}
