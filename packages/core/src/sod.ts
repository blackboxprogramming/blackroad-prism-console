import type { WormLedger } from "@blackroad/worm";
import { DEFAULT_POLICY_CONTEXT } from "./config.js";
import type { GrcRepository } from "./repositories.js";
import { logger } from "./logger.js";
import type { Entitlement, PolicyContext, SodConflict, SodRule } from "./types.js";

export interface SodEvaluationResult {
  conflicts: SodConflict[];
}

export class SodEngine {
  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
    private readonly policy: PolicyContext = DEFAULT_POLICY_CONTEXT,
  ) {}

  async evaluateUser(userId: string): Promise<SodEvaluationResult> {
    const entitlements = await this.repo.findEntitlementsByUser(userId);
    const activeEntitlements = entitlements.filter((ent) => ent.status === "Active");
    const rolesByKey = await this.resolveRoleKeys(activeEntitlements);
    const rules = await this.repo.listSodRules();
    const existing = await this.repo.findOpenSodConflictsByUser(userId);
    const existingKeys = new Set(existing.map((c) => c.ruleKey));

    const conflicts: SodConflict[] = [];
    for (const rule of rules) {
      if (rule.constraint === "FOUR_EYES") continue;
      if (this.violates(rule, rolesByKey)) {
        if (existingKeys.has(rule.key)) {
          const conflict = existing.find((c) => c.ruleKey === rule.key);
          if (conflict) conflicts.push(conflict);
          continue;
        }
        const conflict = await this.repo.createSodConflict({
          userId,
          ruleKey: rule.key,
          status: "Open",
          notes: `Auto-detected conflict for rule ${rule.key}`,
        });
        conflicts.push(conflict);
        await this.worm.append({
          payload: {
            type: "SoDConflictCreated",
            userId,
            ruleKey: rule.key,
            conflictId: conflict.id,
          },
        });
        logger.warn({ userId, ruleKey: rule.key }, "SoD conflict opened");
      }
    }

    return { conflicts };
  }

  private async resolveRoleKeys(entitlements: Entitlement[]): Promise<Set<string>> {
    const keys = new Set<string>();
    for (const ent of entitlements) {
      const role = await this.repo.getRoleById(ent.roleId);
      if (role) keys.add(role.key);
    }
    return keys;
  }

  private violates(rule: SodRule, roles: Set<string>): boolean {
    if (!roles.has(rule.leftRole)) return false;
    switch (rule.constraint) {
      case "MUTUAL_EXCLUSION":
        return rule.rightRole ? roles.has(rule.rightRole) : false;
      case "APPROVER_CANNOT_EXECUTE":
        return rule.rightRole ? roles.has(rule.rightRole) : false;
      default:
        return false;
    }
  }
}
