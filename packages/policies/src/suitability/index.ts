import { z } from "zod";
import type {
  CryptoSuitabilityContext,
  CryptoSuitabilityResult,
  PolicyResult,
} from "../types.js";

const cryptoSchema = z.object({
  questionnaire: z.object({
    riskTolerance: z.enum(["Low", "Moderate", "High", "Speculative"]),
    experienceYears: z.number().min(0),
    objectives: z.array(z.string()),
    incomeStability: z.enum(["Low", "Medium", "High"]),
    drawdownComfort: z.enum(["Low", "Medium", "High"]),
  }),
  wallets: z
    .array(
      z.object({
        walletId: z.string(),
        riskScore: z.number().min(0).max(100),
        ownershipVerified: z.boolean(),
        tags: z.array(z.string()),
      }),
    )
    .default([]),
});

const toleranceToScore: Record<string, number> = {
  Low: 20,
  Moderate: 45,
  High: 70,
  Speculative: 90,
};

const incomeMultiplier: Record<string, number> = {
  Low: -10,
  Medium: 0,
  High: 5,
};

const drawdownMultiplier: Record<string, number> = {
  Low: -15,
  Medium: 0,
  High: 10,
};

function deriveBand(score: number): "LOW" | "MODERATE" | "HIGH" | "SPECULATIVE" {
  if (score < 35) return "LOW";
  if (score < 55) return "MODERATE";
  if (score < 80) return "HIGH";
  return "SPECULATIVE";
}

export function crypto(context: CryptoSuitabilityContext): CryptoSuitabilityResult {
  const parsed = cryptoSchema.parse(context);
  const breaches: string[] = [];

  const baseScore =
    toleranceToScore[parsed.questionnaire.riskTolerance] +
    Math.min(parsed.questionnaire.experienceYears * 3, 15) +
    incomeMultiplier[parsed.questionnaire.incomeStability] +
    drawdownMultiplier[parsed.questionnaire.drawdownComfort] +
    (parsed.questionnaire.objectives.includes("Speculation") ? 10 : 0);

  const walletPenalty = parsed.wallets.reduce((penalty, wallet) => {
    const riskAdjust = wallet.riskScore > 70 ? wallet.riskScore - 70 : 0;
    const ownershipPenalty = wallet.ownershipVerified ? 0 : 20;
    return Math.max(penalty, riskAdjust + ownershipPenalty);
  }, 0);

  const score = Math.max(0, Math.min(100, baseScore - walletPenalty));
  const cryptoRiskBand = deriveBand(score);

  if (walletPenalty >= 20) {
    breaches.push("crypto.wallet_high_risk");
  }

  if (score < 35) {
    breaches.push("crypto.low_capacity");
  }

  const pass = breaches.length === 0;
  const recommendations: string[] = [];
  if (!pass) {
    if (breaches.includes("crypto.wallet_high_risk")) {
      recommendations.push("Require on-chain review or new wallet evidence");
    }
    if (breaches.includes("crypto.low_capacity")) {
      recommendations.push("Review objectives or limit crypto allocation");
    }
  } else {
    recommendations.push("Proceed with crypto onboarding; monitor wallets quarterly");
  }

  return {
    pass,
    breaches,
    risk: score,
    cryptoRiskBand,
    recommendations,
  };
}

export function notImplemented(): PolicyResult {
  return { pass: false, breaches: ["policy.not_implemented"], risk: 0 };
}
