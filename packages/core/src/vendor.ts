import { DateTime } from "luxon";
import type { WormLedger } from "@blackroad/worm";
import type { GrcRepository } from "./repositories.js";
import type { Ddq, Vendor, VendorDoc, VendorDocKind } from "./types.js";

export interface CreateVendorInput {
  name: string;
  category: Vendor["category"];
  criticality: Vendor["criticality"];
  status?: Vendor["status"];
  nextReview?: Date | null;
}

export interface VendorRiskBreakdown {
  base: number;
  docPenalty: number;
  ddqPenalty: number;
  final: number;
}

export class VendorService {
  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
  ) {}

  async registerVendor(input: CreateVendorInput): Promise<Vendor> {
    const vendor = await this.repo.createVendor({
      ...input,
      status: input.status ?? "Onboarding",
      riskScore: 0,
    });
    const updated = await this.recalculateRisk(vendor.id);
    await this.worm.append({
      payload: {
        type: "VendorRegistered",
        vendorId: vendor.id,
      },
    });
    return updated;
  }

  async attachDocument(vendorId: string, doc: Omit<VendorDoc, "id" | "vendorId" | "receivedAt">): Promise<Vendor> {
    await this.repo.addVendorDoc({
      ...doc,
      vendorId,
    });
    await this.worm.append({
      payload: {
        type: "VendorDocAttached",
        vendorId,
        kind: doc.kind,
      },
    });
    return this.recalculateRisk(vendorId);
  }

  async recordDdq(vendorId: string, ddq: Omit<Ddq, "id" | "vendorId">): Promise<Vendor> {
    await this.repo.addDdq({ ...ddq, vendorId });
    await this.worm.append({
      payload: {
        type: "VendorDdqRecorded",
        vendorId,
        questionnaireKey: ddq.questionnaireKey,
      },
    });
    return this.recalculateRisk(vendorId);
  }

  async recalculateRisk(vendorId: string): Promise<Vendor> {
    const vendor = await this.repo.getVendorById(vendorId);
    if (!vendor) throw new Error(`Vendor ${vendorId} not found`);
    const docs = await this.repo.listVendorDocs(vendorId);
    const ddqs = await this.repo.listDdqs(vendorId);
    const breakdown = this.computeRisk(vendor, docs, ddqs);
    const updated = await this.repo.updateVendor(vendorId, {
      riskScore: breakdown.final,
    });
    await this.worm.append({
      payload: {
        type: "VendorRiskUpdated",
        vendorId,
        breakdown,
      },
    });
    return updated;
  }

  computeRisk(vendor: Vendor, docs: VendorDoc[], ddqs: Ddq[]): VendorRiskBreakdown {
    const base = this.baseRisk(vendor.criticality);
    const docPenalty = this.docPenalty(docs);
    const ddqPenalty = this.ddqPenalty(ddqs);
    const final = Math.min(100, Math.max(0, base + docPenalty + ddqPenalty));
    return { base, docPenalty, ddqPenalty, final };
  }

  private baseRisk(criticality: Vendor["criticality"]): number {
    switch (criticality) {
      case "High":
        return 55;
      case "Medium":
        return 35;
      case "Low":
      default:
        return 20;
    }
  }

  private docPenalty(docs: VendorDoc[]): number {
    const now = DateTime.now();
    const required: VendorDocKind[] = ["SOC2", "BCP", "Insurance"];
    let penalty = 0;
    for (const kind of required) {
      const doc = docs.find((d) => d.kind === kind);
      if (!doc) {
        penalty += 15;
        continue;
      }
      if (doc.expiresAt && DateTime.fromJSDate(doc.expiresAt) < now) {
        penalty += 10;
      }
    }
    return penalty;
  }

  private ddqPenalty(ddqs: Ddq[]): number {
    const completed = ddqs.filter((d) => d.status === "Completed");
    if (completed.length === 0) return 20;
    const avg = completed.reduce((acc, item) => acc + item.score, 0) / completed.length;
    return Math.max(0, 50 - avg * 0.4);
  }
}
