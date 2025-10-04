import { describe, expect, it } from "vitest";
import { createInMemoryDb } from "@blackroad/compliance-db";
import {
  adsMarketingRuleEvaluator,
  gate,
  needsFreshAttestation,
  publishPolicy,
  recordAttestation,
} from "@blackroad/compliance-core";
import { runReview as runAdvertisingReview } from "@blackroad/compliance-reviewers/advertising";
import { appendWorm, verifyWormChain } from "@blackroad/compliance-archival";
import { scheduleU4Amendment } from "@blackroad/compliance-jobs";

const baseAdInput = {
  subject: "communication" as const,
  context: {},
  data: {
    title: "Sample Ad",
    contentUrl: "sandbox:/ads/ad.pdf",
    containsPerformance: true,
    performancePeriods: ["1Y"],
    containsTestimonials: true,
    disclosures: ["testimonial_disclosure", "net_gross_disclosure", "prospectus_reference"],
  },
};

describe("Policy evaluators", () => {
  it("ads marketing rule is deterministic", () => {
    const first = adsMarketingRuleEvaluator.evaluate(baseAdInput);
    const second = adsMarketingRuleEvaluator.evaluate(baseAdInput);
    expect(second).toEqual(first);
  });
});

describe("Gates", () => {
  it("blocks advising when CE incomplete", async () => {
    const db = createInMemoryDb();
    const result = await gate(db, "advise", { ceCompleted: false });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });
});

describe("Advertising reviews", () => {
  it("flags missing disclosures", async () => {
    const db = createInMemoryDb();
    const result = await runAdvertisingReview(db, {
      title: "MN Fund One-Pager",
      contentUrl: "sandbox:/ads/mn.pdf",
      content: "performance testimonial", 
      containsPerformance: true,
      performancePeriods: [],
      containsTestimonials: true,
      disclosures: [],
      cta: "Contact us",
    });

    expect(result.outcome).toBe("NeedsChanges");
    expect(result.aggregate.breaches).toEqual(
      expect.arrayContaining([
        "ads.missing_testimonial_disclosure",
        "ads.performance_missing_period",
        "ads.performance_missing_disclosure",
        "ads.prospectus_missing",
      ])
    );
  });
});

describe("WORM", () => {
  it("detects tampering", async () => {
    const db = createInMemoryDb();
    await appendWorm({ db, payload: { type: "policy", key: "ads" } });
    const latest = await db.worm.getLatest();
    await db.worm.append({
      idx: (latest?.idx ?? 0) + 1,
      ts: new Date(),
      payload: { type: "tamper" },
      prevHash: "bad",
      hash: "bad",
    });
    const verification = await verifyWormChain(db);
    expect(verification.ok).toBe(false);
    expect(verification.issues.some((issue) => issue.reason.includes("Hash mismatch"))).toBe(true);
  });
});

describe("Calendaring", () => {
  it("SD risk requires 10 business day deadline", async () => {
    const db = createInMemoryDb({
      now: () => new Date("2024-01-02T00:00:00Z"),
    });
    const changeDate = new Date("2024-01-02T00:00:00Z");
    const record = await scheduleU4Amendment(db, {
      key: "U4-CHANGE-1",
      summary: "SD risk change",
      changeDate,
      riskFlags: ["sd-risk"],
    });
    expect(record.due.toISOString()).toBe("2024-01-16T00:00:00.000Z");
  });
});

describe("Attestations", () => {
  it("requires attestation on version bump", async () => {
    const db = createInMemoryDb();
    const policy = await publishPolicy({
      db,
      actor: { id: "admin", role: "admin", name: "Alexa" },
      key: "ads.marketing_rule",
      title: "Advertising",
      body: {},
      controls: ["ads.marketing_rule"],
      effectiveAt: new Date("2024-01-01T00:00:00Z"),
    });

    await recordAttestation({
      db,
      policyKey: policy.key,
      userId: "alexa",
      period: "Initial",
      answers: { acknowledged: true },
      signedAt: new Date("2024-01-01T00:00:00Z"),
    });

    const needsBefore = await needsFreshAttestation(db, policy.key, "alexa");
    expect(needsBefore).toBe(false);

    await publishPolicy({
      db,
      actor: { id: "admin", role: "admin", name: "Alexa" },
      key: policy.key,
      title: policy.title,
      body: {},
      controls: policy.controls,
      effectiveAt: new Date("2024-06-01T00:00:00Z"),
    });

    const needsAfter = await needsFreshAttestation(db, policy.key, "alexa");
    expect(needsAfter).toBe(true);
  });
});
