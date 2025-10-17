import Decimal from "decimal.js";
import { DateTime } from "luxon";
import {
  AccountFeePlan,
  FeeAccrualRecord,
  FeeSchedule,
  InvoiceDraft,
  InvoiceLine,
  InvoiceLineComponent,
} from "./types.js";
import { decimalToNumber } from "./utils.js";

export interface InvoiceGenerationInput {
  plan: AccountFeePlan;
  schedule: FeeSchedule;
  accruals: FeeAccrualRecord[];
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

export function generateInArrearsInvoice(
  input: InvoiceGenerationInput
): InvoiceDraft {
  const { plan, schedule, billingPeriodStart, billingPeriodEnd } = input;
  if (plan.billMode !== "InArrears") {
    throw new Error("generateInArrearsInvoice only supports InArrears plans");
  }
  if (plan.billFrequency !== "Monthly" && plan.billFrequency !== "Quarterly") {
    throw new Error(`Unsupported billing frequency ${plan.billFrequency}`);
  }

  const startDt = DateTime.fromJSDate(billingPeriodStart).startOf("day");
  const endDt = DateTime.fromJSDate(billingPeriodEnd).startOf("day");

  const accruals = input.accruals.filter((accrual) => {
    const asOf = DateTime.fromJSDate(accrual.asOf).startOf("day");
    return (asOf >= startDt && asOf <= endDt) && accrual.planId === plan.id;
  });

  const totalAccrued = accruals.reduce(
    (sum, accrual) => sum.plus(accrual.amount),
    new Decimal(0)
  );

  const minimum = schedule.spec.minimumUSD
    ? new Decimal(schedule.spec.minimumUSD)
    : new Decimal(0);

  let total = totalAccrued;
  const lines: InvoiceLine[] = [];
  const components: InvoiceLineComponent[] = [];

  if (accruals.length > 0) {
    components.push({
      label: "BASE_TIER",
      amount: decimalToNumber(totalAccrued),
      meta: {
        days: accruals.length,
        averageRateBps:
          accruals.reduce((sum, accrual) => sum + accrual.rateBps, 0) /
          accruals.length,
      },
    });
  }

  if (minimum.greaterThan(total)) {
    const diff = minimum.minus(total);
    total = minimum;
    components.push({
      label: "MINIMUM_ADJUSTMENT",
      amount: decimalToNumber(diff),
      meta: { minimumUSD: schedule.spec.minimumUSD },
    });
  }

  lines.push({
    accountId: plan.accountId,
    amount: decimalToNumber(total),
    components,
  });

  return {
    billingPeriodStart,
    billingPeriodEnd,
    billingGroupId: plan.billingGroupId ?? undefined,
    accountId: plan.accountId,
    currency: plan.billCurrency,
    amount: decimalToNumber(total),
    lines,
    minimumAppliedUSD: minimum.greaterThan(totalAccrued)
      ? schedule.spec.minimumUSD
      : undefined,
  };
}

