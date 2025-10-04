import { createHash } from "crypto";

export interface WalletScreeningResult {
  riskScore: number;
  tags: string[];
}

export function screen(chain: string, address: string): WalletScreeningResult {
  const hash = createHash("sha256").update(`${chain}:${address}`).digest("hex");
  const riskScore = parseInt(hash.slice(0, 4), 16) % 101;
  const tags: string[] = [];
  if (riskScore > 80) {
    tags.push("sanction_proximity");
  } else if (riskScore > 60) {
    tags.push("mixer_proximity");
  }
  return { riskScore, tags };
}
