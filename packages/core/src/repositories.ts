import { randomUUID } from "node:crypto";
import type {
  BcpPlan,
  BcpTestRecord,
  Ddq,
  Entitlement,
  Incident,
  Kri,
  Role,
  Rfc,
  SodConflict,
  SodRule,
  User,
  Vendor,
  VendorDoc,
} from "./types.js";

export interface GrcRepository {
  getUserById(id: string): Promise<User | null>;
  getRoleById(id: string): Promise<Role | null>;
  getRoleByKey(key: string): Promise<Role | null>;
  listRoles(): Promise<Role[]>;
  addRole(role: Role): Promise<Role>;

  createEntitlement(data: Omit<Entitlement, "id" | "grantedAt"> & { id?: string }): Promise<Entitlement>;
  updateEntitlement(id: string, data: Partial<Entitlement>): Promise<Entitlement>;
  getEntitlementById(id: string): Promise<Entitlement | null>;
  findEntitlementsByUser(userId: string): Promise<Entitlement[]>;
  listEntitlements(): Promise<Entitlement[]>;
  listEntitlementsNeedingRecert(reference: Date): Promise<Entitlement[]>;

  listSodRules(): Promise<SodRule[]>;
  addSodRule(rule: Omit<SodRule, "id"> & { id?: string }): Promise<SodRule>;

  createSodConflict(data: Omit<SodConflict, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Promise<SodConflict>;
  updateSodConflict(id: string, data: Partial<SodConflict>): Promise<SodConflict>;
  findOpenSodConflictsByUser(userId: string): Promise<SodConflict[]>;
  listSodConflicts(): Promise<SodConflict[]>;

  createRfc(data: Omit<Rfc, "id" | "riskScore" | "status" | "approverIds"> & { id?: string; riskScore?: number; status?: Rfc["status"]; approverIds?: string[] }): Promise<Rfc>;
  updateRfc(id: string, data: Partial<Rfc>): Promise<Rfc>;
  getRfcById(id: string): Promise<Rfc | null>;
  listRfcs(): Promise<Rfc[]>;

  createVendor(data: Omit<Vendor, "id" | "riskScore"> & { id?: string; riskScore?: number }): Promise<Vendor>;
  updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor>;
  getVendorById(id: string): Promise<Vendor | null>;
  listVendors(): Promise<Vendor[]>;

  addVendorDoc(data: Omit<VendorDoc, "id" | "receivedAt"> & { id?: string; receivedAt?: Date }): Promise<VendorDoc>;
  listVendorDocs(vendorId: string): Promise<VendorDoc[]>;

  addDdq(data: Omit<Ddq, "id"> & { id?: string }): Promise<Ddq>;
  listDdqs(vendorId: string): Promise<Ddq[]>;

  createIncident(data: Omit<Incident, "id"> & { id?: string }): Promise<Incident>;
  updateIncident(id: string, data: Partial<Incident>): Promise<Incident>;
  getIncidentById(id: string): Promise<Incident | null>;
  listIncidents(): Promise<Incident[]>;

  createBcpPlan(data: Omit<BcpPlan, "id"> & { id?: string }): Promise<BcpPlan>;
  updateBcpPlan(id: string, data: Partial<BcpPlan>): Promise<BcpPlan>;
  getActiveBcpPlan(): Promise<BcpPlan | null>;
  listBcpPlans(): Promise<BcpPlan[]>;

  recordBcpTest(data: Omit<BcpTestRecord, "id" | "runAt"> & { id?: string; runAt?: Date }): Promise<BcpTestRecord>;
  listBcpTests(planId: string): Promise<BcpTestRecord[]>;

  upsertKri(data: Omit<Kri, "id"> & { id?: string }): Promise<Kri>;
  listLatestKri(): Promise<Kri[]>;
}

export class InMemoryGrcRepository implements GrcRepository {
  private users = new Map<string, User>();
  private roles = new Map<string, Role>();
  private entitlements = new Map<string, Entitlement>();
  private sodRules = new Map<string, SodRule>();
  private sodConflicts = new Map<string, SodConflict>();
  private rfcs = new Map<string, Rfc>();
  private vendors = new Map<string, Vendor>();
  private vendorDocs = new Map<string, VendorDoc>();
  private ddqs = new Map<string, Ddq>();
  private incidents = new Map<string, Incident>();
  private bcpPlans = new Map<string, BcpPlan>();
  private bcpTests = new Map<string, BcpTestRecord>();
  private kris = new Map<string, Kri>();

  constructor(seed?: { users?: User[]; roles?: Role[] }) {
    seed?.users?.forEach((u) => this.users.set(u.id, u));
    seed?.roles?.forEach((r) => this.roles.set(r.id, r));
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null;
  }

  async getRoleByKey(key: string): Promise<Role | null> {
    return [...this.roles.values()].find((role) => role.key === key) ?? null;
  }

  async listRoles(): Promise<Role[]> {
    return [...this.roles.values()];
  }

  async addRole(role: Role): Promise<Role> {
    const id = role.id ?? randomUUID();
    const record = { ...role, id };
    this.roles.set(id, record);
    return record;
  }

  async createEntitlement(data: Omit<Entitlement, "id" | "grantedAt"> & { id?: string }): Promise<Entitlement> {
    const id = data.id ?? randomUUID();
    const record: Entitlement = {
      ...data,
      id,
      grantedAt: data.grantedAt ?? new Date(),
    };
    this.entitlements.set(id, record);
    return record;
  }

  async updateEntitlement(id: string, data: Partial<Entitlement>): Promise<Entitlement> {
    const existing = this.entitlements.get(id);
    if (!existing) throw new Error(`Entitlement ${id} not found`);
    const updated: Entitlement = { ...existing, ...data };
    this.entitlements.set(id, updated);
    return updated;
  }

  async getEntitlementById(id: string): Promise<Entitlement | null> {
    return this.entitlements.get(id) ?? null;
  }

  async findEntitlementsByUser(userId: string): Promise<Entitlement[]> {
    return [...this.entitlements.values()].filter((e) => e.userId === userId);
  }

  async listEntitlements(): Promise<Entitlement[]> {
    return [...this.entitlements.values()];
  }

  async listEntitlementsNeedingRecert(reference: Date): Promise<Entitlement[]> {
    return [...this.entitlements.values()].filter((ent) =>
      ent.recertDue ? ent.recertDue.getTime() <= reference.getTime() : false,
    );
  }

  async listSodRules(): Promise<SodRule[]> {
    return [...this.sodRules.values()];
  }

  async addSodRule(rule: Omit<SodRule, "id"> & { id?: string }): Promise<SodRule> {
    const id = rule.id ?? randomUUID();
    const record: SodRule = { ...rule, id };
    this.sodRules.set(id, record);
    return record;
  }

  async createSodConflict(data: Omit<SodConflict, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Promise<SodConflict> {
    const id = data.id ?? randomUUID();
    const record: SodConflict = {
      ...data,
      id,
      createdAt: data.createdAt ?? new Date(),
    };
    this.sodConflicts.set(id, record);
    return record;
  }

  async updateSodConflict(id: string, data: Partial<SodConflict>): Promise<SodConflict> {
    const existing = this.sodConflicts.get(id);
    if (!existing) throw new Error(`SoD conflict ${id} not found`);
    const record: SodConflict = { ...existing, ...data };
    this.sodConflicts.set(id, record);
    return record;
  }

  async findOpenSodConflictsByUser(userId: string): Promise<SodConflict[]> {
    return [...this.sodConflicts.values()].filter(
      (conflict) => conflict.userId === userId && conflict.status === "Open",
    );
  }

  async listSodConflicts(): Promise<SodConflict[]> {
    return [...this.sodConflicts.values()];
  }

  async createRfc(data: Omit<Rfc, "id" | "riskScore" | "status" | "approverIds"> & {
    id?: string;
    riskScore?: number;
    status?: Rfc["status"];
    approverIds?: string[];
  }): Promise<Rfc> {
    const id = data.id ?? randomUUID();
    const record: Rfc = {
      approverIds: data.approverIds ?? [],
      riskScore: data.riskScore ?? 0,
      status: data.status ?? "Draft",
      notes: data.notes ?? null,
      ...data,
      id,
    };
    this.rfcs.set(id, record);
    return record;
  }

  async updateRfc(id: string, data: Partial<Rfc>): Promise<Rfc> {
    const existing = this.rfcs.get(id);
    if (!existing) throw new Error(`RFC ${id} not found`);
    const record: Rfc = { ...existing, ...data };
    this.rfcs.set(id, record);
    return record;
  }

  async getRfcById(id: string): Promise<Rfc | null> {
    return this.rfcs.get(id) ?? null;
  }

  async listRfcs(): Promise<Rfc[]> {
    return [...this.rfcs.values()];
  }

  async createVendor(data: Omit<Vendor, "id" | "riskScore"> & { id?: string; riskScore?: number }): Promise<Vendor> {
    const id = data.id ?? randomUUID();
    const record: Vendor = {
      ...data,
      id,
      riskScore: data.riskScore ?? 0,
    };
    this.vendors.set(id, record);
    return record;
  }

  async updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const existing = this.vendors.get(id);
    if (!existing) throw new Error(`Vendor ${id} not found`);
    const record: Vendor = { ...existing, ...data };
    this.vendors.set(id, record);
    return record;
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    return this.vendors.get(id) ?? null;
  }

  async listVendors(): Promise<Vendor[]> {
    return [...this.vendors.values()];
  }

  async addVendorDoc(data: Omit<VendorDoc, "id" | "receivedAt"> & { id?: string; receivedAt?: Date }): Promise<VendorDoc> {
    const id = data.id ?? randomUUID();
    const record: VendorDoc = {
      ...data,
      id,
      receivedAt: data.receivedAt ?? new Date(),
    };
    this.vendorDocs.set(id, record);
    return record;
  }

  async listVendorDocs(vendorId: string): Promise<VendorDoc[]> {
    return [...this.vendorDocs.values()].filter((doc) => doc.vendorId === vendorId);
  }

  async addDdq(data: Omit<Ddq, "id"> & { id?: string }): Promise<Ddq> {
    const id = data.id ?? randomUUID();
    const record: Ddq = { ...data, id };
    this.ddqs.set(id, record);
    return record;
  }

  async listDdqs(vendorId: string): Promise<Ddq[]> {
    return [...this.ddqs.values()].filter((ddq) => ddq.vendorId === vendorId);
  }

  async createIncident(data: Omit<Incident, "id"> & { id?: string }): Promise<Incident> {
    const id = data.id ?? randomUUID();
    const record: Incident = { ...data, id };
    this.incidents.set(id, record);
    return record;
  }

  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    const existing = this.incidents.get(id);
    if (!existing) throw new Error(`Incident ${id} not found`);
    const record: Incident = { ...existing, ...data };
    this.incidents.set(id, record);
    return record;
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) ?? null;
  }

  async listIncidents(): Promise<Incident[]> {
    return [...this.incidents.values()];
  }

  async createBcpPlan(data: Omit<BcpPlan, "id"> & { id?: string }): Promise<BcpPlan> {
    const id = data.id ?? randomUUID();
    const record: BcpPlan = { ...data, id };
    this.bcpPlans.set(id, record);
    return record;
  }

  async updateBcpPlan(id: string, data: Partial<BcpPlan>): Promise<BcpPlan> {
    const existing = this.bcpPlans.get(id);
    if (!existing) throw new Error(`BCP plan ${id} not found`);
    const record: BcpPlan = { ...existing, ...data };
    this.bcpPlans.set(id, record);
    return record;
  }

  async getActiveBcpPlan(): Promise<BcpPlan | null> {
    return (
      [...this.bcpPlans.values()].find((plan) => plan.status === "Active") ?? null
    );
  }

  async listBcpPlans(): Promise<BcpPlan[]> {
    return [...this.bcpPlans.values()];
  }

  async recordBcpTest(data: Omit<BcpTestRecord, "id" | "runAt"> & { id?: string; runAt?: Date }): Promise<BcpTestRecord> {
    const id = data.id ?? randomUUID();
    const record: BcpTestRecord = {
      ...data,
      id,
      runAt: data.runAt ?? new Date(),
    };
    this.bcpTests.set(id, record);
    return record;
  }

  async listBcpTests(planId: string): Promise<BcpTestRecord[]> {
    return [...this.bcpTests.values()].filter((test) => test.planId === planId);
  }

  async upsertKri(data: Omit<Kri, "id"> & { id?: string }): Promise<Kri> {
    const id = data.id ?? randomUUID();
    const record: Kri = { ...data, id };
    this.kris.set(record.key, record);
    return record;
  }

  async listLatestKri(): Promise<Kri[]> {
    return [...this.kris.values()];
  }
}
