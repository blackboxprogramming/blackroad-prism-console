import { randomUUID } from "node:crypto";
import {
  ScenarioContext,
  SurveillanceAlert,
  defaultScenarioPolicies,
  MixerScreeningResult,
} from "../types.js";

export function detectMixerProximity(context: ScenarioContext): SurveillanceAlert[] {
  const policies = { ...defaultScenarioPolicies, ...context.policies };
  const alerts: SurveillanceAlert[] = [];
  const results = buildResults(context);

  for (const result of results) {
    if (!result.isMixerProximity) continue;
    const closestHop = result.hops.sort((a, b) => a.distance - b.distance)[0];
    if (!closestHop) continue;
    if (closestHop.distance > policies.mixerMaxHops) continue;

    const key = `${result.wallet}|${closestHop.address}|${closestHop.distance}`;
    const severity = Math.max(80, policies.mixerSevereRisk - closestHop.distance * 5);
    alerts.push({
      id: randomUUID(),
      kind: "CRYPTO",
      scenario: "MIXER_PROXIMITY",
      severity,
      status: "Open",
      key,
      signal: {
        wallet: result.wallet,
        hops: result.hops.map((hop) => ({
          address: hop.address,
          tag: hop.tag,
          riskLevel: hop.riskLevel,
          distance: hop.distance,
        })),
        closest: closestHop,
        policyMaxHops: policies.mixerMaxHops,
      },
      createdAt: new Date(),
    });
  }

  return alerts;
}

function buildResults(context: ScenarioContext): MixerScreeningResult[] {
  if (context.screeningResults && context.screeningResults.length > 0) {
    return context.screeningResults;
  }

  const byWallet = new Map<string, MixerScreeningResult>();
  for (const transfer of context.walletTransfers) {
    if (!transfer.screeningPath || transfer.screeningPath.length === 0) continue;
    const path = transfer.screeningPath;
    const isMixer = path.some((hop) => hop.tag.toLowerCase().includes("mixer") || hop.tag.toLowerCase().includes("sanction"));
    if (!isMixer) continue;
    const existing = byWallet.get(transfer.wallet);
    const mergedHops = existing ? [...existing.hops, ...path] : [...path];
    byWallet.set(transfer.wallet, {
      wallet: transfer.wallet,
      hops: mergedHops,
      isMixerProximity: true,
      maxRisk: mergedHops.some((hop) => hop.riskLevel === "SEVERE") ? "SEVERE" : "HIGH",
    });
  }
  return [...byWallet.values()];
}
