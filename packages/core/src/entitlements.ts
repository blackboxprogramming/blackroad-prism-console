import { DateTime } from "luxon";
import type { WormLedger } from "@blackroad/worm";
import { DEFAULT_POLICY_CONTEXT } from "./config.js";
import type { GrcRepository } from "./repositories.js";
import { SodEngine } from "./sod.js";
import { logger } from "./logger.js";
import type { Entitlement, PolicyContext, SodConflict } from "./types.js";

export interface GrantEntitlementInput {
  userId: string;
  roleId: string;
  grantedBy: string;
  expiresAt?: Date | null;
}

export interface GrantEntitlementResult {
  entitlement: Entitlement;
  conflicts: SodConflict[];
}

export class EntitlementService {
  constructor(
    private readonly repo: GrcRepository,
    private readonly sod: SodEngine,
    private readonly worm: WormLedger,
    private readonly policy: PolicyContext = DEFAULT_POLICY_CONTEXT,
  ) {}

  async grant(input: GrantEntitlementInput): Promise<GrantEntitlementResult> {
    const entitlement = await this.repo.createEntitlement({
      ...input,
      status: "Active",
      recertDue: DateTime.now()
        .plus({ days: this.policy.defaultRecertIntervalDays })
        .toJSDate(),
    });

    await this.worm.append({
      payload: {
        type: "EntitlementGranted",
        entitlementId: entitlement.id,
        userId: input.userId,
        roleId: input.roleId,
        grantedBy: input.grantedBy,
      },
    });

    const conflicts = (await this.sod.evaluateUser(input.userId)).conflicts;
    return { entitlement, conflicts };
  }

  async revoke(entitlementId: string, revokedBy: string): Promise<Entitlement> {
    const entitlement = await this.repo.updateEntitlement(entitlementId, {
      status: "Revoked",
    });
    await this.worm.append({
      payload: {
        type: "EntitlementRevoked",
        entitlementId,
        revokedBy,
      },
    });
    logger.info({ entitlementId, revokedBy }, "Entitlement revoked");
    return entitlement;
  }

  async touchRecert(entitlementId: string, reviewerId: string): Promise<Entitlement> {
    const entitlement = await this.repo.updateEntitlement(entitlementId, {
      recertDue: DateTime.now()
        .plus({ days: this.policy.defaultRecertIntervalDays })
        .toJSDate(),
    });
    await this.worm.append({
      payload: {
        type: "EntitlementRecertified",
        entitlementId,
        reviewerId,
        recertDue: entitlement.recertDue,
      },
    });
    return entitlement;
  }

  async expire(entitlementId: string): Promise<Entitlement> {
    const entitlement = await this.repo.updateEntitlement(entitlementId, {
      status: "Expired",
    });
    await this.worm.append({
      payload: {
        type: "EntitlementExpired",
        entitlementId,
      },
    });
    return entitlement;
  }
}
