import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { ProrationContext } from "./types.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const DAYS_IN_YEAR = 365;

export function toDecimal(value: Decimal.Value): Decimal {
  return new Decimal(value ?? 0);
}

export function decimalToNumber(value: Decimal): number {
  return Number(value.toFixed(8));
}

export function annualBpsToDailyRate(bps: number, daysInYear = DAYS_IN_YEAR): Decimal {
  return toDecimal(bps).div(10000).div(daysInYear);
}

export function prorateForPlan(context: ProrationContext): Decimal {
  const { asOf, start, end } = context;
  if (asOf < start) {
    return toDecimal(0);
  }
  if (end && asOf > end) {
    return toDecimal(0);
  }
  return toDecimal(1);
}

export function daysInPeriod(start: Date, end: Date): number {
  const startDt = DateTime.fromJSDate(start).startOf("day");
  const endDt = DateTime.fromJSDate(end).startOf("day");
  const diff = endDt.diff(startDt, "days").days;
  return Math.max(1, Math.round(diff || 0));
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

