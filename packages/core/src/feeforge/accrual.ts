import { DateTime } from "luxon";
import { computeRate } from "./rate-calculator.js";
import {
  AccrualComputationInput,
  FeeAccrualRecord,
  FeeComponentLabel,
} from "./types.js";
import { annualBpsToDailyRate, decimalToNumber, toDecimal } from "./utils.js";

export interface DailyAccrualOptions {
  daysInYear?: number;
}

export function computeDailyAccrual(
  input: AccrualComputationInput,
  options: DailyAccrualOptions = {}
): FeeAccrualRecord {
  const { plan, schedule, marketValue } = input;
  const daysInYear = options.daysInYear ?? 365;
  const asOf = DateTime.fromJSDate(marketValue.asOf).startOf("day");
  const start = DateTime.fromJSDate(plan.startDate).startOf("day");
  const end = plan.endDate ? DateTime.fromJSDate(plan.endDate).startOf("day") : null;
  if (asOf < start) {
    return emptyAccrual(plan.accountId, plan.id, schedule.id, marketValue, []);
  }
  if (end && asOf > end) {
    return emptyAccrual(plan.accountId, plan.id, schedule.id, marketValue, []);
  }

  const rateResult = computeRate({
    plan,
    schedule: schedule.spec,
    marketValue,
    householdValue: input.householdValue,
  });

  if (rateResult.baseAmount <= 0 || rateResult.effectiveBps === 0) {
    return emptyAccrual(plan.accountId, plan.id, schedule.id, marketValue, rateResult.components);
  }

  const dailyRate = annualBpsToDailyRate(rateResult.effectiveBps, daysInYear);
  const accrualAmount = toDecimal(rateResult.baseAmount).mul(dailyRate);
  const amount = decimalToNumber(accrualAmount);

  const components = [
    ...rateResult.components,
    {
      label: "BASE_TIER" as FeeComponentLabel,
      detail: `Daily accrual @ ${rateResult.effectiveBps.toFixed(4)}bps`,
      amount,
      rateBps: rateResult.effectiveBps,
    },
  ];

  return {
    accountId: plan.accountId,
    asOf: marketValue.asOf,
    baseAUM: rateResult.baseAmount,
    rateBps: rateResult.effectiveBps,
    amount,
    components,
    planId: plan.id,
    scheduleId: schedule.id,
  };
}

function emptyAccrual(
  accountId: string,
  planId: string,
  scheduleId: string,
  marketValue: { asOf: Date },
  components: FeeAccrualRecord["components"],
): FeeAccrualRecord {
  return {
    accountId,
    asOf: marketValue.asOf,
    baseAUM: 0,
    rateBps: 0,
    amount: 0,
    components,
    planId,
    scheduleId,
  };
}

