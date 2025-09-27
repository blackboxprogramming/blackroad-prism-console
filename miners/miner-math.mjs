#!/usr/bin/env node
/**
 * Simple calculator for estimating power cost, solar offsets, and hypothetical revenue.
 *
 * Usage examples:
 *   node miner-math.mjs --watts=2 --kwh=0.15 --hrs=24 --rev=0
 *   node miner-math.mjs --watts=2 --kwh=0.15 --hrs=6 --rev=0.005
 *
 * Arguments (defaults in parentheses):
 *   --watts=<instantaneous draw in watts> (5)
 *   --kwh=<local electricity price per kWh> (0.15)
 *   --hrs=<hours per day that the miner is enabled> (24)
 *   --rev=<assumed revenue per day in USD> (0)
 */

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((segment) => segment.split('='))
    .map(([key, value]) => [key.replace(/^--/, ''), value])
);

const watts = Number(args.watts ?? 5);
const kwh = Number(args.kwh ?? 0.15);
const hoursPerDay = Number(args.hrs ?? 24);
const revenuePerDay = Number(args.rev ?? 0);

if (Number.isNaN(watts) || Number.isNaN(kwh) || Number.isNaN(hoursPerDay) || Number.isNaN(revenuePerDay)) {
  console.error('All arguments must be numeric. Example: node miner-math.mjs --watts=2 --kwh=0.12 --hrs=12 --rev=0.01');
  process.exit(1);
}

const kWhPerDay = (watts / 1000) * hoursPerDay;
const costPerDay = kWhPerDay * kwh;
const costPerMonth = costPerDay * 30;
const marginPerDay = revenuePerDay - costPerDay;
const marginPerMonth = marginPerDay * 30;
const averageWatts = watts * (hoursPerDay / 24);

const result = {
  inputs: {
    watts,
    electricity_price_per_kwh: kwh,
    hours_per_day: hoursPerDay,
    revenue_per_day_usd: revenuePerDay,
  },
  derived: {
    average_watts: Number(averageWatts.toFixed(3)),
    kwh_per_day: Number(kWhPerDay.toFixed(4)),
    cost_per_day_usd: Number(costPerDay.toFixed(4)),
    cost_per_month_usd: Number(costPerMonth.toFixed(4)),
    margin_per_day_usd: Number(marginPerDay.toFixed(4)),
    margin_per_month_usd: Number(marginPerMonth.toFixed(4)),
  },
  notes: [
    'Adjust --hrs to model duty cycling (e.g., 6 hours/day = 25% duty cycle).',
    'Set --rev based on pool calculators or expected payouts; Pi-class hardware typically earns < $0.01/day.',
    'Pair the result with a small solar panel estimate to demonstrate near-zero net energy draw.',
  ],
};

console.log(JSON.stringify(result, null, 2));
