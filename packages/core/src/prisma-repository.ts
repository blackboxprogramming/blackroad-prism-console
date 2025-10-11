import { PrismaClient } from "@prisma/client";
import type {
  BcpPlan,
  BcpTestRecord,
  Ddq,
  Entitlement,
  Incident,
  Kri,
  Rfc,
  Role,
  SodConflict,
  SodRule,
  User,
  Vendor,
  VendorDoc,
} from "./types.js";
import type { GrcRepository } from "./repositories.js";

function mapEntitlement(record: any): Entitlement {
  return {
    id: record.id,
    userId: record.userId,
    roleId: record.roleId,
    grantedBy: record.grantedBy,
    grantedAt: record.grantedAt,
    expiresAt: record.expiresAt,
    status: record.status,
    recertDue: record.recertDue,
  };
}

function mapSodRule(record: any): SodRule {
  return {
    id: record.id,
    key: record.key,
    description: record.description,
    constraint: record.constraint,
    leftRole: record.leftRole,
    rightRole: record.rightRole,
    scope: record.scope,
    severity: record.severity,
  };
}

function mapSodConflict(record: any): SodConflict {
  return {
    id: record.id,
    userId: record.userId,
    ruleKey: record.ruleKey,
    status: record.status,
    createdAt: record.createdAt,
    resolvedAt: record.resolvedAt,
    notes: record.notes,
  };
}

function mapRfc(record: any): Rfc {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    description: record.description,
    riskScore: record.riskScore,
    status: record.status,
    requesterId: record.requesterId,
    approverIds: record.approverIds,
    submittedAt: record.submittedAt,
    decidedAt: record.decidedAt,
    implementedAt: record.implementedAt,
    rollbackPlan: record.rollbackPlan,
    postImplReview: record.postImplReview,
    links: record.links,
    notes: record.notes,
  };
}

function mapVendor(record: any): Vendor {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    criticality: record.criticality,
    status: record.status,
    riskScore: record.riskScore,
    nextReview: record.nextReview,
  };
}

function mapVendorDoc(record: any): VendorDoc {
  return {
    id: record.id,
    vendorId: record.vendorId,
    kind: record.kind,
    path: record.path,
    sha256: record.sha256,
    expiresAt: record.expiresAt,
    receivedAt: record.receivedAt,
  };
}

function mapDdq(record: any): Ddq {
  return {
    id: record.id,
    vendorId: record.vendorId,
    questionnaireKey: record.questionnaireKey,
    answers: record.answers,
    score: record.score,
    status: record.status,
    completedAt: record.completedAt,
  };
}

function mapIncident(record: any): Incident {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    severity: record.severity,
    status: record.status,
    detectedAt: record.detectedAt,
    acknowledgedAt: record.acknowledgedAt,
    resolvedAt: record.resolvedAt,
    description: record.description,
    rootCause: record.rootCause,
    correctiveActions: record.correctiveActions,
    communications: record.communications,
    relatedIds: record.relatedIds,
  };
}

function mapBcpPlan(record: any): BcpPlan {
  return {
    id: record.id,
    version: record.version,
    effectiveAt: record.effectiveAt,
    rtoMinutes: record.rtoMinutes,
    rpoMinutes: record.rpoMinutes,
    contacts: record.contacts,
    scenarios: record.scenarios,
    tests: record.tests,
    status: record.status,
  };
}

function mapBcpTest(record: any): BcpTestRecord {
  return {
    id: record.id,
    planId: record.planId,
    runAt: record.runAt,
    scenario: record.scenario,
    participants: record.participants,
    issues: record.issues,
    outcome: record.outcome,
  };
}

function mapKri(record: any): Kri {
  return {
    id: record.id,
    key: record.key,
    label: record.label,
    value: record.value,
    asOf: record.asOf,
    meta: record.meta,
  };
}

export class PrismaGrcRepository implements GrcRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  async getRoleByKey(key: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { key } });
  }

  async listRoles(): Promise<Role[]> {
    return this.prisma.role.findMany();
  }

  async addRole(role: Role): Promise<Role> {
    return this.prisma.role.create({ data: role });
  }

  async createEntitlement(data: Omit<Entitlement, "id" | "grantedAt"> & { id?: string }): Promise<Entitlement> {
    const record = await this.prisma.entitlement.create({
      data: {
        ...data,
        grantedAt: data.grantedAt ?? new Date(),
      },
    });
    return mapEntitlement(record);
  }

  async updateEntitlement(id: string, data: Partial<Entitlement>): Promise<Entitlement> {
    const record = await this.prisma.entitlement.update({ where: { id }, data });
    return mapEntitlement(record);
  }

  async getEntitlementById(id: string): Promise<Entitlement | null> {
    const record = await this.prisma.entitlement.findUnique({ where: { id } });
    return record ? mapEntitlement(record) : null;
  }

  async findEntitlementsByUser(userId: string): Promise<Entitlement[]> {
    const records = await this.prisma.entitlement.findMany({ where: { userId } });
    return records.map(mapEntitlement);
  }

  async listEntitlements(): Promise<Entitlement[]> {
    const records = await this.prisma.entitlement.findMany();
    return records.map(mapEntitlement);
  }

  async listEntitlementsNeedingRecert(reference: Date): Promise<Entitlement[]> {
    const records = await this.prisma.entitlement.findMany({
      where: {
        recertDue: { lte: reference },
      },
    });
    return records.map(mapEntitlement);
  }

  async listSodRules(): Promise<SodRule[]> {
    const records = await this.prisma.soDRule.findMany();
    return records.map(mapSodRule);
  }

  async addSodRule(rule: Omit<SodRule, "id"> & { id?: string }): Promise<SodRule> {
    const record = await this.prisma.soDRule.create({ data: rule });
    return mapSodRule(record);
  }

  async createSodConflict(data: Omit<SodConflict, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Promise<SodConflict> {
    const record = await this.prisma.soDConflict.create({
      data: { ...data, createdAt: data.createdAt ?? new Date() },
    });
    return mapSodConflict(record);
  }

  async updateSodConflict(id: string, data: Partial<SodConflict>): Promise<SodConflict> {
    const record = await this.prisma.soDConflict.update({ where: { id }, data });
    return mapSodConflict(record);
  }

  async findOpenSodConflictsByUser(userId: string): Promise<SodConflict[]> {
    const records = await this.prisma.soDConflict.findMany({
      where: { userId, status: "Open" },
    });
    return records.map(mapSodConflict);
  }

  async listSodConflicts(): Promise<SodConflict[]> {
    const records = await this.prisma.soDConflict.findMany();
    return records.map(mapSodConflict);
  }

  async createRfc(data: Omit<Rfc, "id" | "riskScore" | "status" | "approverIds"> & {
    id?: string;
    riskScore?: number;
    status?: Rfc["status"];
    approverIds?: string[];
  }): Promise<Rfc> {
    const record = await this.prisma.rFC.create({
      data: {
        ...data,
        riskScore: data.riskScore ?? 0,
        status: data.status ?? "Draft",
        approverIds: data.approverIds ?? [],
        notes: (data as any).notes ?? null,
      },
    });
    return mapRfc(record);
  }

  async updateRfc(id: string, data: Partial<Rfc>): Promise<Rfc> {
    const record = await this.prisma.rFC.update({ where: { id }, data });
    return mapRfc(record);
  }

  async getRfcById(id: string): Promise<Rfc | null> {
    const record = await this.prisma.rFC.findUnique({ where: { id } });
    return record ? mapRfc(record) : null;
  }

  async listRfcs(): Promise<Rfc[]> {
    const records = await this.prisma.rFC.findMany();
    return records.map(mapRfc);
  }

  async createVendor(data: Omit<Vendor, "id" | "riskScore"> & { id?: string; riskScore?: number }): Promise<Vendor> {
    const record = await this.prisma.vendor.create({
      data: { ...data, riskScore: data.riskScore ?? 0 },
    });
    return mapVendor(record);
  }

  async updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const record = await this.prisma.vendor.update({ where: { id }, data });
    return mapVendor(record);
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    const record = await this.prisma.vendor.findUnique({ where: { id } });
    return record ? mapVendor(record) : null;
  }

  async listVendors(): Promise<Vendor[]> {
    const records = await this.prisma.vendor.findMany();
    return records.map(mapVendor);
  }

  async addVendorDoc(data: Omit<VendorDoc, "id" | "receivedAt"> & { id?: string; receivedAt?: Date }): Promise<VendorDoc> {
    const record = await this.prisma.vendorDoc.create({
      data: {
        ...data,
        receivedAt: data.receivedAt ?? new Date(),
      },
    });
    return mapVendorDoc(record);
  }

  async listVendorDocs(vendorId: string): Promise<VendorDoc[]> {
    const records = await this.prisma.vendorDoc.findMany({ where: { vendorId } });
    return records.map(mapVendorDoc);
  }

  async addDdq(data: Omit<Ddq, "id"> & { id?: string }): Promise<Ddq> {
    const record = await this.prisma.dDQ.create({ data });
    return mapDdq(record);
  }

  async listDdqs(vendorId: string): Promise<Ddq[]> {
    const records = await this.prisma.dDQ.findMany({ where: { vendorId } });
    return records.map(mapDdq);
  }

  async createIncident(data: Omit<Incident, "id"> & { id?: string }): Promise<Incident> {
    const record = await this.prisma.incident.create({ data });
    return mapIncident(record);
  }

  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    const record = await this.prisma.incident.update({ where: { id }, data });
    return mapIncident(record);
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const record = await this.prisma.incident.findUnique({ where: { id } });
    return record ? mapIncident(record) : null;
  }

  async listIncidents(): Promise<Incident[]> {
    const records = await this.prisma.incident.findMany();
    return records.map(mapIncident);
  }

  async createBcpPlan(data: Omit<BcpPlan, "id"> & { id?: string }): Promise<BcpPlan> {
    const record = await this.prisma.bCPPlan.create({ data });
    return mapBcpPlan(record);
  }

  async updateBcpPlan(id: string, data: Partial<BcpPlan>): Promise<BcpPlan> {
    const record = await this.prisma.bCPPlan.update({ where: { id }, data });
    return mapBcpPlan(record);
  }

  async getActiveBcpPlan(): Promise<BcpPlan | null> {
    const record = await this.prisma.bCPPlan.findFirst({ where: { status: "Active" } });
    return record ? mapBcpPlan(record) : null;
  }

  async listBcpPlans(): Promise<BcpPlan[]> {
    const records = await this.prisma.bCPPlan.findMany();
    return records.map(mapBcpPlan);
  }

  async recordBcpTest(data: Omit<BcpTestRecord, "id" | "runAt"> & { id?: string; runAt?: Date }): Promise<BcpTestRecord> {
    const record = await this.prisma.bcpTestRecord.create({
      data: { ...data, runAt: data.runAt ?? new Date() },
    });
    return mapBcpTest(record);
  }

  async listBcpTests(planId: string): Promise<BcpTestRecord[]> {
    const records = await this.prisma.bcpTestRecord.findMany({ where: { planId } });
    return records.map(mapBcpTest);
  }

  async upsertKri(data: Omit<Kri, "id"> & { id?: string }): Promise<Kri> {
    const record = await this.prisma.kRI.upsert({
      where: { key: data.key },
      update: {
        label: data.label,
        value: data.value,
        asOf: data.asOf,
        meta: data.meta,
      },
      create: data,
    });
    return mapKri(record);
  }

  async listLatestKri(): Promise<Kri[]> {
    const records = await this.prisma.kRI.findMany();
    return records.map(mapKri);
  }
}
