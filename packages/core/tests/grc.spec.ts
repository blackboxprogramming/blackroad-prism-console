import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  BcpService,
  DEFAULT_POLICY_CONTEXT,
  EntitlementService,
  Gatekeeper,
  IncidentService,
  InMemoryGrcRepository,
  RfcService,
  SodEngine,
  VendorService,
} from "@blackroad/grc-core";
import { InMemoryWormLedger } from "@blackroad/worm";

const policy = DEFAULT_POLICY_CONTEXT;

describe("GRC core", () => {
  it("detects SoD conflicts and blocks gated actions", async () => {
    const repo = new InMemoryGrcRepository({
      roles: [
        { id: "r1", key: "BILLING_ISSUER", title: "Billing Issuer" },
        { id: "r2", key: "PAYMENTS_POSTER", title: "Payments Poster" },
      ],
    });
    const worm = new InMemoryWormLedger();
    await repo.addSodRule({
      id: "rule1",
      key: "NO_BILL_AND_POST",
      description: "Cannot bill and post",
      constraint: "MUTUAL_EXCLUSION",
      leftRole: "BILLING_ISSUER",
      rightRole: "PAYMENTS_POSTER",
      severity: 90,
      scope: null,
    });
    await repo.createEntitlement({
      id: "e1",
      userId: "u1",
      roleId: "r1",
      grantedBy: "system",
      status: "Active",
      recertDue: new Date(),
    });
    const sod = new SodEngine(repo, worm, policy);
    const entitlements = new EntitlementService(repo, sod, worm, policy);
    await entitlements.grant({ userId: "u1", roleId: "r2", grantedBy: "system" });
    const gate = new Gatekeeper(repo, worm, policy);
    const decision = await gate.check("payments.post", { userId: "u1" });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("SoD conflict");
  });

  it("enforces four-eyes on high-risk actions", async () => {
    const repo = new InMemoryGrcRepository();
    const worm = new InMemoryWormLedger();
    const gate = new Gatekeeper(repo, worm, policy);
    const decision = await gate.check("billing.issue", {
      userId: "prep1",
      preparerId: "prep1",
      approverIds: ["prep1"],
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Approver must be distinct");
  });

  it("requires multi-party approvals for high risk RFCs", async () => {
    const repo = new InMemoryGrcRepository();
    const worm = new InMemoryWormLedger();
    const rfc = new RfcService(repo, worm);
    const record = await rfc.create({
      title: "Deploy trading engine",
      type: "CODE",
      description: "Hot path",
      requesterId: "alice",
      rollbackPlan: "Rollback plan",
    });
    await rfc.submit(record.id, "alice", {
      risk: {
        impact: "Critical",
        rollbackComplexity: "High",
        touchesPii: true,
      },
    });
    await rfc.approve(record.id, "bob");
    await rfc.approve(record.id, "carol");
    const updated = await rfc.approve(record.id, "dave", { isControlOwner: true });
    expect(updated.status).toBe("Approved");
    const implemented = await rfc.markImplemented(record.id);
    expect(implemented.status).toBe("Implemented");
  });

  it("blocks vendor-dependent actions when risk too high", async () => {
    const repo = new InMemoryGrcRepository();
    const worm = new InMemoryWormLedger();
    const vendorSvc = new VendorService(repo, worm);
    const gate = new Gatekeeper(repo, worm, policy);
    const vendor = await vendorSvc.registerVendor({
      name: "Custodian X",
      category: "Custodian",
      criticality: "High",
    });
    const decisionBeforeDocs = await gate.check("custody.deduction", {
      userId: "u1",
      vendorId: vendor.id,
    });
    expect(decisionBeforeDocs.allowed).toBe(false);
    await vendorSvc.attachDocument(vendor.id, {
      kind: "SOC2",
      path: "/soc2.pdf",
      sha256: "abc",
      expiresAt: DateTime.now().plus({ days: 30 }).toJSDate(),
    });
    await vendorSvc.attachDocument(vendor.id, {
      kind: "BCP",
      path: "/bcp.pdf",
      sha256: "def",
      expiresAt: DateTime.now().plus({ days: 30 }).toJSDate(),
    });
    await vendorSvc.attachDocument(vendor.id, {
      kind: "Insurance",
      path: "/insurance.pdf",
      sha256: "ghi",
      expiresAt: DateTime.now().plus({ days: 30 }).toJSDate(),
    });
    const decisionAfterDocs = await gate.check("custody.deduction", {
      userId: "u1",
      vendorId: vendor.id,
    });
    expect(decisionAfterDocs.allowed).toBe(true);
  });

  it("computes incident MTTA/MTTR and logs", async () => {
    const repo = new InMemoryGrcRepository();
    const worm = new InMemoryWormLedger();
    const incidents = new IncidentService(repo, worm, policy);
    const incident = await incidents.open({
      title: "Phishing",
      type: "Security",
      severity: "SEV2",
      description: "Targeted attack",
      detectedAt: DateTime.now().minus({ hours: 4 }).toJSDate(),
    });
    await incidents.acknowledge(incident.id, "responder");
    await incidents.resolve(incident.id, { rootCause: "User clicked", correctiveActions: "Training" });
    const metrics = await incidents.metrics();
    expect(metrics.meanTimeToAcknowledge).toBeGreaterThan(0);
    expect(metrics.meanTimeToResolve).toBeGreaterThan(metrics.meanTimeToAcknowledge);
  });

  it("raises gate when BCP test is overdue", async () => {
    const repo = new InMemoryGrcRepository();
    const worm = new InMemoryWormLedger();
    const bcp = new BcpService(repo, worm, policy);
    const plan = await bcp.publishPlan({
      version: 1,
      effectiveAt: new Date(),
      rtoMinutes: 60,
      rpoMinutes: 15,
      contacts: {},
      scenarios: {},
    });
    await repo.recordBcpTest({
      planId: plan.id,
      scenario: "Custodian outage",
      participants: ["a"],
      issues: [],
      outcome: "Pass",
      runAt: DateTime.now().minus({ days: 400 }).toJSDate(),
      id: "test1",
    });
    const gate = new Gatekeeper(repo, worm, policy);
    const decision = await gate.check("open_account", { userId: "u1" });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("BCP");
  });

  it("detects tampering in WORM ledger", async () => {
    const worm = new InMemoryWormLedger();
    await worm.append({ payload: { type: "Test", value: 1 } });
    await worm.append({ payload: { type: "Test", value: 2 } });
    expect(await worm.verify()).toBe(true);
    (worm as any).blocks[0].hash = "tampered";
    expect(await worm.verify()).toBe(false);
  });
});
