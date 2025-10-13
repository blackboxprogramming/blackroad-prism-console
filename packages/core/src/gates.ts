import { DateTime } from "luxon";
import type { WormLedger } from "@blackroad/worm";
import { DEFAULT_POLICY_CONTEXT } from "./config.js";
import type { GrcRepository } from "./repositories.js";
import type { GateDecision, PolicyContext } from "./types.js";

export interface GateContext {
  userId?: string;
  vendorId?: string;
  rfcId?: string;
  approverIds?: string[];
  preparerId?: string;
}

export class Gatekeeper {
  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
    private readonly policy: PolicyContext = DEFAULT_POLICY_CONTEXT,
  ) {}

  async check(action: string, context: GateContext = {}): Promise<GateDecision> {
    const evaluatedAt = new Date();
    const decision: GateDecision = {
      action,
      allowed: true,
      context,
      evaluatedAt,
    };

    if (context.userId) {
      const sodConflictReason = await this.checkSod(context.userId, action);
      if (sodConflictReason) {
        decision.allowed = false;
        decision.reason = sodConflictReason;
        await this.recordGate(decision);
        return decision;
      }

      const recertReason = await this.checkRecert(context.userId);
      if (recertReason) {
        decision.allowed = false;
        decision.reason = recertReason;
        await this.recordGate(decision);
        return decision;
      }
    }

    if (action === "change.deploy") {
      if (!context.rfcId) {
        decision.allowed = false;
        decision.reason = "RFC context required";
        await this.recordGate(decision);
        return decision;
      }
      const rfc = await this.repo.getRfcById(context.rfcId);
      if (!rfc || rfc.status !== "Approved") {
        decision.allowed = false;
        decision.reason = "RFC not approved";
        await this.recordGate(decision);
        return decision;
      }
    }

    if (this.policy.fourEyesActions.has(action)) {
      const reason = this.checkFourEyes(context);
      if (reason) {
        decision.allowed = false;
        decision.reason = reason;
        await this.recordGate(decision);
        return decision;
      }
    }

    if (context.vendorId) {
      const vendorReason = await this.checkVendor(context.vendorId);
      if (vendorReason) {
        decision.allowed = false;
        decision.reason = vendorReason;
        await this.recordGate(decision);
        return decision;
      }
    }

    const bcpReason = await this.checkBcp(action);
    if (bcpReason) {
      decision.allowed = false;
      decision.reason = bcpReason;
      await this.recordGate(decision);
      return decision;
    }

    await this.recordGate(decision);
    return decision;
  }

  private async checkSod(userId: string, action: string): Promise<string | null> {
    const conflicts = await this.repo.findOpenSodConflictsByUser(userId);
    if (conflicts.length === 0) return null;
    const rules = await this.repo.listSodRules();
    const ruleMap = new Map(rules.map((rule) => [rule.key, rule] as const));
    const blocking = conflicts.find((conflict) => {
      const rule = ruleMap.get(conflict.ruleKey);
      if (!rule) return false;
      if (rule.severity >= this.policy.sodSeverityThreshold) return true;
      return action.startsWith("payments") || action.startsWith("billing") || action.startsWith("ads");
    });
    if (!blocking) return null;
    return `SoD conflict ${blocking.ruleKey} active`;
  }

  private async checkRecert(userId: string): Promise<string | null> {
    const entitlements = await this.repo.findEntitlementsByUser(userId);
    const now = DateTime.now();
    const overdue = entitlements.find((ent) => {
      if (!ent.recertDue) return false;
      const due = DateTime.fromJSDate(ent.recertDue);
      return due.plus({ days: this.policy.recertGraceDays }).toMillis() < now.toMillis();
    });
    if (!overdue) return null;
    return `Entitlement ${overdue.id} recertification overdue`;
  }

  private checkFourEyes(context: GateContext): string | null {
    const { preparerId, approverIds } = context;
    if (!preparerId || !approverIds || approverIds.length < 1) {
      return "Four-eyes approval requires preparer and approver";
    }
    const uniqueApprovers = new Set(approverIds.filter(Boolean));
    if (uniqueApprovers.size < 1 || uniqueApprovers.has(preparerId)) {
      return "Approver must be distinct from preparer";
    }
    if (uniqueApprovers.size < 2) {
      return "At least two distinct approvers required";
    }
    return null;
  }

  private async checkVendor(vendorId: string): Promise<string | null> {
    const vendor = await this.repo.getVendorById(vendorId);
    if (!vendor) return `Vendor ${vendorId} not found`;
    if (vendor.criticality === "High" && vendor.riskScore >= this.policy.vendorCriticalRiskThreshold) {
      return `Vendor ${vendor.name} risk ${vendor.riskScore} exceeds threshold`;
    }
    const docs = await this.repo.listVendorDocs(vendorId);
    const now = DateTime.now();
    const requiredDocs: Array<{ kind: string; label: string }> = [
      { kind: "SOC2", label: "SOC 2" },
      { kind: "BCP", label: "BCP" },
    ];
    for (const req of requiredDocs) {
      const doc = docs.find((d) => d.kind === req.kind);
      if (!doc) return `${req.label} document missing for vendor ${vendor.name}`;
      if (doc.expiresAt && DateTime.fromJSDate(doc.expiresAt) < now) {
        return `${req.label} document expired for vendor ${vendor.name}`;
      }
    }
    return null;
  }

  private async checkBcp(action: string): Promise<string | null> {
    const plan = await this.repo.getActiveBcpPlan();
    if (!plan) {
      if (action === "open_account" || action === "trade_bd") {
        return "No active BCP plan";
      }
      return null;
    }
    const tests = await this.repo.listBcpTests(plan.id);
    if (tests.length === 0) {
      if (action === "open_account" || action === "trade_bd") {
        return "BCP not tested";
      }
      return null;
    }
    const lastTest = tests.reduce((latest, current) =>
      current.runAt > latest.runAt ? current : latest,
    );
    const stale = DateTime.fromJSDate(lastTest.runAt)
      .plus({ days: this.policy.bcPlanTestCadenceDays })
      .toMillis() < DateTime.now().toMillis();
    if (stale && (action === "open_account" || action === "trade_bd")) {
      return "BCP test overdue";
    }
    return null;
  }

  private async recordGate(decision: GateDecision): Promise<void> {
    await this.worm.append({
      payload: {
        type: "GateEvaluated",
        ...decision,
      },
    });
  }
}
