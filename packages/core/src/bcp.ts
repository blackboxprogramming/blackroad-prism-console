import { DateTime } from "luxon";
import type { WormLedger } from "@blackroad/worm";
import { DEFAULT_POLICY_CONTEXT } from "./config.js";
import type { GrcRepository } from "./repositories.js";
import { logger } from "./logger.js";
import type { BcpPlan, BcpTestRecord, PolicyContext } from "./types.js";

export interface PublishPlanInput {
  version: number;
  effectiveAt: Date;
  rtoMinutes: number;
  rpoMinutes: number;
  contacts: unknown;
  scenarios: unknown;
  tests?: unknown;
  status?: BcpPlan["status"];
}

export interface RunTestInput {
  planId: string;
  scenario: string;
  participants: string[];
  issues: string[];
  outcome: BcpTestRecord["outcome"];
}

export class BcpService {
  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
    private readonly policy: PolicyContext = DEFAULT_POLICY_CONTEXT,
  ) {}

  async publishPlan(input: PublishPlanInput): Promise<BcpPlan> {
    const plan = await this.repo.createBcpPlan({
      ...input,
      status: input.status ?? "Active",
      tests: input.tests ?? [],
    });
    if (plan.status === "Active") {
      const plans = await this.repo.listBcpPlans();
      for (const other of plans) {
        if (other.id !== plan.id && other.status === "Active") {
          await this.repo.updateBcpPlan(other.id, { status: "Draft" });
        }
      }
    }
    await this.worm.append({
      payload: {
        type: "BcpPlanPublished",
        planId: plan.id,
        version: plan.version,
      },
    });
    return plan;
  }

  async recordTest(input: RunTestInput): Promise<BcpTestRecord> {
    const test = await this.repo.recordBcpTest({
      planId: input.planId,
      scenario: input.scenario,
      participants: input.participants,
      issues: input.issues,
      outcome: input.outcome,
    });
    await this.worm.append({
      payload: {
        type: "BcpTestRun",
        planId: input.planId,
        testId: test.id,
        outcome: input.outcome,
      },
    });
    return test;
  }

  async lastTestAge(planId: string): Promise<number> {
    const tests = await this.repo.listBcpTests(planId);
    if (tests.length === 0) return Infinity;
    const latest = tests.reduce((acc, item) => (item.runAt > acc.runAt ? item : acc));
    return DateTime.now().diff(DateTime.fromJSDate(latest.runAt), "days").days;
  }

  async ensureCadence(planId: string): Promise<void> {
    const age = await this.lastTestAge(planId);
    if (age > this.policy.bcPlanTestCadenceDays) {
      logger.warn({ planId, age }, "BCP test overdue");
      await this.worm.append({
        payload: {
          type: "BcpTestOverdue",
          planId,
          age,
        },
      });
    }
  }
}
