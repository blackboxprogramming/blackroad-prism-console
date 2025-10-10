import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { SurveillanceAlert } from "../types.js";
import { WormLedger } from "@blackroad/worm";

export interface SuppressionRuleInput {
  scenario: string;
  keyPattern: string;
  expiresAt?: Date;
  reason: string;
  createdBy: string;
}

export interface SuppressionRuleRecord extends SuppressionRuleInput {
  id: string;
  createdAt: Date;
}

export class SuppressionService {
  private rules: SuppressionRuleRecord[] = [];

  constructor(private readonly ledger?: WormLedger) {}

  addRule(input: SuppressionRuleInput): SuppressionRuleRecord {
    const rule: SuppressionRuleRecord = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.rules.push(rule);
    void this.ledger?.append({ payload: { type: "SUPPRESSION_RULE_CREATED", rule } });
    return rule;
  }

  shouldSuppress(alert: SurveillanceAlert): boolean {
    const now = new Date();
    return this.rules.some((rule) => {
      if (rule.scenario !== alert.scenario) return false;
      if (rule.expiresAt && rule.expiresAt < now) return false;
      return new RegExp(rule.keyPattern).test(alert.key);
    });
  }

  getRules(): SuppressionRuleRecord[] {
    return [...this.rules];
  }
}

export class AlertDeduper {
  private recentAlerts = new Map<string, { signalHash: string; alert: SurveillanceAlert }>();

  constructor(private readonly lookbackMs: number = 1000 * 60 * 60 * 24) {}

  filter(alerts: SurveillanceAlert[]): SurveillanceAlert[] {
    const now = Date.now();
    const filtered: SurveillanceAlert[] = [];
    for (const alert of alerts) {
      const key = `${alert.scenario}|${alert.key}`;
      const signalHash = hashSignal(alert.signal);
      const existing = this.recentAlerts.get(key);
      if (existing && existing.signalHash === signalHash) {
        continue;
      }
      if (existing && now - existing.alert.createdAt.getTime() > this.lookbackMs) {
        this.recentAlerts.delete(key);
      }
      this.recentAlerts.set(key, { signalHash, alert });
      filtered.push(alert);
    }
    return filtered;
  }
}

function hashSignal(signal: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(signal)).digest("hex");
}
