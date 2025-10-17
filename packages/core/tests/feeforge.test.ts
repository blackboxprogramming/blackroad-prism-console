import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  AccountFeePlan,
  FeeSchedule,
  computeDailyAccrual,
  generateInArrearsInvoice,
  InMemoryExceptionQueue,
} from "../src/feeforge/index.js";

function buildPlan(overrides: Partial<AccountFeePlan> = {}): AccountFeePlan {
  return {
    id: "plan-1",
    accountId: "ACC-1",
    feeScheduleId: "fs-1",
    billingGroupId: null,
    startDate: new Date("2025-01-01T00:00:00Z"),
    endDate: null,
    billFrequency: "Quarterly",
    billMode: "InArrears",
    billCurrency: "USD",
    custodyDeductionAllowed: true,
    performanceFeeAllowed: false,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

function buildSchedule(overrides: Partial<FeeSchedule["spec"]> = {}): FeeSchedule {
  return {
    id: "fs-1",
    name: "Core",
    status: "Active",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    spec: {
      base: {
        method: "AUM_TIERED",
        tiers: [
          { upTo: 1_000_000, rateBps: 100 },
          { upTo: 2_000_000, rateBps: 75 },
          { rateBps: 50 },
        ],
      },
      minimumUSD: 0,
      discounts: [],
      adders: [],
      capBps: 300,
      allowFeeCreditsFromMF: false,
      performance: null,
      householding: { enabled: false, includeAccounts: [] },
      valuation: { method: "EOD_MV", includeCrypto: false, priceSource: "CustodySync" },
      ...overrides,
    },
  };
}

describe("FeeForge engine", () => {
  it("computes tiered blended rate and daily accrual", () => {
    const plan = buildPlan();
    const schedule = buildSchedule();
    const asOf = new Date("2025-03-31T00:00:00Z");
    const accrual = computeDailyAccrual({
      plan,
      schedule,
      marketValue: {
        accountId: plan.accountId,
        asOf,
        marketValue: 2_500_000,
      },
    });
    expect(accrual.rateBps).toBeCloseTo(80, 3);
    expect(accrual.amount).toBeCloseTo((2_500_000 * 0.008) / 365, 2);
  });

  it("enforces cap when adders push rate above maximum", () => {
    const plan = buildPlan();
    const schedule = buildSchedule({
      adders: [{ label: "Crypto", rule: "CRYPTO", bps: 400 }],
      capBps: 250,
    });
    const accrual = computeDailyAccrual({
      plan,
      schedule,
      marketValue: {
        accountId: plan.accountId,
        asOf: new Date("2025-03-31T00:00:00Z"),
        marketValue: 1_000_000,
      },
    });
    expect(accrual.rateBps).toBe(250);
  });

  it("supports householding by using combined MV for breakpoints", () => {
    const schedule = buildSchedule({ householding: { enabled: true, includeAccounts: "ALL" } });
    const planA = buildPlan({ id: "plan-A", accountId: "ACC-A" });
    const planB = buildPlan({ id: "plan-B", accountId: "ACC-B" });
    const householdTotal = 3_000_000;
    const accrualA = computeDailyAccrual({
      plan: planA,
      schedule,
      marketValue: {
        accountId: planA.accountId,
        asOf: new Date("2025-03-31T00:00:00Z"),
        marketValue: 1_000_000,
      },
      householdValue: householdTotal,
    });
    const accrualB = computeDailyAccrual({
      plan: planB,
      schedule,
      marketValue: {
        accountId: planB.accountId,
        asOf: new Date("2025-03-31T00:00:00Z"),
        marketValue: 2_000_000,
      },
      householdValue: householdTotal,
    });

    // Combined household produces 75bps blended rate (1mm*100 + 1mm*75 + 1mm*50)/3mm = 75bps
    expect(accrualA.rateBps).toBeCloseTo(75, 3);
    expect(accrualB.rateBps).toBeCloseTo(75, 3);
    // Each account accrues on its own balance
    expect(accrualA.baseAUM).toBeCloseTo(1_000_000);
    expect(accrualB.baseAUM).toBeCloseTo(2_000_000);
  });

  it("prorates new account by skipping accruals before start", () => {
    const plan = buildPlan({ startDate: new Date("2025-03-15T00:00:00Z") });
    const schedule = buildSchedule();
    const preStart = computeDailyAccrual({
      plan,
      schedule,
      marketValue: {
        accountId: plan.accountId,
        asOf: new Date("2025-03-10T00:00:00Z"),
        marketValue: 1_000_000,
      },
    });
    expect(preStart.amount).toBe(0);

    const postStart = computeDailyAccrual({
      plan,
      schedule,
      marketValue: {
        accountId: plan.accountId,
        asOf: new Date("2025-03-20T00:00:00Z"),
        marketValue: 1_000_000,
      },
    });
    expect(postStart.amount).toBeGreaterThan(0);
  });

  it("aggregates quarterly accruals into invoices applying minimums", () => {
    const plan = buildPlan();
    const schedule = buildSchedule({ minimumUSD: 500 });
    const accruals = Array.from({ length: 90 }).map((_, idx) =>
      computeDailyAccrual({
        plan,
        schedule,
        marketValue: {
          accountId: plan.accountId,
          asOf: DateTime.fromISO("2025-01-01", { zone: "utc" })
            .plus({ days: idx })
            .toJSDate(),
          marketValue: 50_000,
        },
      })
    );
    const invoice = generateInArrearsInvoice({
      plan,
      schedule,
      accruals,
      billingPeriodStart: new Date("2025-01-01T00:00:00Z"),
      billingPeriodEnd: new Date("2025-03-31T00:00:00Z"),
    });
    expect(invoice.amount).toBe(500);
    expect(invoice.minimumAppliedUSD).toBe(500);
  });

  it("maintains exception queue lifecycle", () => {
    const queue = new InMemoryExceptionQueue();
    const created = queue.enqueue({
      code: "CAP_EXCEEDED",
      severity: 90,
      message: "Exceeded cap",
    });
    expect(queue.listOpen()).toHaveLength(1);
    const resolved = queue.resolve(created.id, "Approved", "Waived after review");
    expect(resolved.status).toBe("Approved");
    expect(queue.listOpen()).toHaveLength(0);
  });
});

