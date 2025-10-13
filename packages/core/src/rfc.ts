import type { WormLedger } from "@blackroad/worm";
import { computeRiskScore, type RiskInputs } from "./config.js";
import type { GrcRepository } from "./repositories.js";
import { logger } from "./logger.js";
import type { Rfc, RfcType } from "./types.js";

export interface CreateRfcInput {
  title: string;
  type: RfcType;
  description: string;
  requesterId: string;
  links?: unknown;
  rollbackPlan?: string | null;
}

export interface SubmitRfcInput {
  risk: RiskInputs;
  links?: unknown;
}

export class RfcService {
  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
  ) {}

  async create(input: CreateRfcInput): Promise<Rfc> {
    const rfc = await this.repo.createRfc({
      ...input,
      links: input.links ?? {},
    });
    await this.worm.append({
      payload: {
        type: "RfcCreated",
        rfcId: rfc.id,
        requesterId: rfc.requesterId,
      },
    });
    return rfc;
  }

  async submit(id: string, requesterId: string, input: SubmitRfcInput): Promise<Rfc> {
    const rfc = await this.repo.getRfcById(id);
    if (!rfc) throw new Error(`RFC ${id} not found`);
    if (rfc.requesterId !== requesterId) {
      throw new Error("Only requester can submit RFC");
    }
    const riskScore = computeRiskScore(rfc.type, input.risk);
    const updated = await this.repo.updateRfc(id, {
      status: "InReview",
      riskScore,
      submittedAt: new Date(),
      links: input.links ?? rfc.links,
    });
    await this.worm.append({
      payload: {
        type: "RfcSubmitted",
        rfcId: id,
        riskScore,
      },
    });
    return updated;
  }

  async approve(id: string, approverId: string, options: { isControlOwner?: boolean } = {}): Promise<Rfc> {
    const rfc = await this.repo.getRfcById(id);
    if (!rfc) throw new Error(`RFC ${id} not found`);
    if (rfc.requesterId === approverId) {
      throw new Error("Requester cannot approve their own RFC");
    }
    if (!["InReview", "Approved"].includes(rfc.status)) {
      throw new Error(`RFC not in approvable status: ${rfc.status}`);
    }
    const approvers = new Set(rfc.approverIds);
    approvers.add(approverId);
    const requiredApprovals = this.requiredApprovals(rfc.riskScore);
    const controlOwnerRequired = rfc.riskScore >= 70;
    const existingControl = rfc.links && typeof rfc.links === "object" && (rfc as any).controlOwnerId;

    const nextData: Partial<Rfc> & { approverIds: string[] } = {
      approverIds: [...approvers],
    };
    if (options.isControlOwner) {
      (nextData as any).controlOwnerId = approverId;
    }

    if (approvers.size >= requiredApprovals && (!controlOwnerRequired || options.isControlOwner || existingControl)) {
      nextData.status = "Approved";
      nextData.decidedAt = new Date();
    }

    const updated = await this.repo.updateRfc(id, nextData);
    await this.worm.append({
      payload: {
        type: "RfcApproved",
        rfcId: id,
        approverId,
        status: updated.status,
      },
    });
    return updated;
  }

  async reject(id: string, approverId: string, reason: string): Promise<Rfc> {
    const rfc = await this.repo.getRfcById(id);
    if (!rfc) throw new Error(`RFC ${id} not found`);
    if (rfc.status !== "InReview") throw new Error("RFC not in review");
    const updated = await this.repo.updateRfc(id, {
      status: "Rejected",
      decidedAt: new Date(),
      notes: reason,
    } as any);
    await this.worm.append({
      payload: {
        type: "RfcRejected",
        rfcId: id,
        approverId,
        reason,
      },
    });
    return updated;
  }

  async markImplemented(id: string): Promise<Rfc> {
    const rfc = await this.repo.getRfcById(id);
    if (!rfc) throw new Error(`RFC ${id} not found`);
    if (rfc.status !== "Approved") {
      throw new Error("RFC must be approved before implementation");
    }
    const updated = await this.repo.updateRfc(id, {
      status: "Implemented",
      implementedAt: new Date(),
    });
    await this.worm.append({
      payload: {
        type: "RfcImplemented",
        rfcId: id,
      },
    });
    return updated;
  }

  async markFailed(id: string, reason: string): Promise<Rfc> {
    const updated = await this.repo.updateRfc(id, {
      status: "Failed",
      decidedAt: new Date(),
      postImplReview: { reason },
    });
    await this.worm.append({
      payload: {
        type: "RfcFailed",
        rfcId: id,
        reason,
      },
    });
    return updated;
  }

  async rollback(id: string, reason: string): Promise<Rfc> {
    const updated = await this.repo.updateRfc(id, {
      status: "RolledBack",
      decidedAt: new Date(),
      postImplReview: { reason },
    });
    await this.worm.append({
      payload: {
        type: "RfcRolledBack",
        rfcId: id,
        reason,
      },
    });
    logger.warn({ id, reason }, "RFC rolled back");
    return updated;
  }

  private requiredApprovals(riskScore: number): number {
    if (riskScore >= 70) return 3;
    if (riskScore >= 40) return 2;
    return 1;
  }
}
