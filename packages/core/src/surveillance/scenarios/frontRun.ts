import { randomUUID } from "node:crypto";
import {
  ScenarioContext,
  SurveillanceAlert,
  defaultScenarioPolicies,
  minutesBetween,
} from "../types.js";

export function detectFrontRunning(context: ScenarioContext): SurveillanceAlert[] {
  const policies = { ...defaultScenarioPolicies, ...context.policies };
  const alerts: SurveillanceAlert[] = [];
  const trades = [...context.trades].filter((t) => Boolean(t.repId));
  const byRepSymbol = new Map<string, typeof trades>();

  for (const trade of trades) {
    const key = `${trade.repId}|${trade.symbol}`;
    const arr = byRepSymbol.get(key) ?? [];
    arr.push(trade);
    byRepSymbol.set(key, arr);
  }

  for (const [repSymbol, repTrades] of byRepSymbol.entries()) {
    const sorted = repTrades.sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime());
    for (let i = 0; i < sorted.length; i += 1) {
      const trade = sorted[i];
      if (!trade.isEmployeeAccount) continue;
      for (let j = i + 1; j < sorted.length; j += 1) {
        const clientTrade = sorted[j];
        if (clientTrade.isEmployeeAccount) continue;
        const diffMinutes = minutesBetween(trade.executedAt, clientTrade.executedAt);
        if (diffMinutes > policies.frontRunWindowMinutes) {
          break;
        }
        const personalNotional = trade.quantity * trade.price;
        if (personalNotional < policies.frontRunMinNotional) {
          continue;
        }
        const key = [repSymbol, trade.id, clientTrade.id].join("|");
        const signal = {
          repId: trade.repId,
          symbol: trade.symbol,
          personalTradeId: trade.id,
          clientTradeId: clientTrade.id,
          personalAccount: trade.accountId,
          clientAccount: clientTrade.accountId,
          personalNotional,
          clientNotional: clientTrade.quantity * clientTrade.price,
          executedAt: [trade.executedAt.toISOString(), clientTrade.executedAt.toISOString()],
          windowMinutes: policies.frontRunWindowMinutes,
        };
        alerts.push({
          id: randomUUID(),
          kind: "TRADE",
          scenario: "FRONT_RUN",
          severity: 92,
          status: "Open",
          key,
          signal,
          createdAt: new Date(),
        });
        break;
      }
    }
  }

  return alerts;
}
