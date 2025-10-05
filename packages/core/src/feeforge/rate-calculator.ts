import Decimal from "decimal.js";
import {
  AccountFeePlan,
  FeeAccrualComponent,
  FeeSpec,
  MarketValueSlice,
} from "./types.js";
import { decimalToNumber, toDecimal } from "./utils.js";

export interface RateComputationInput {
  plan: AccountFeePlan;
  schedule: FeeSpec;
  marketValue: MarketValueSlice;
  householdValue?: number;
}

export interface RateComputationResult {
  baseAmount: number;
  effectiveBps: number;
  components: FeeAccrualComponent[];
}

function computeHouseheldValue(
  spec: FeeSpec,
  market: MarketValueSlice,
  householdValue?: number
): number {
  if (!spec.householding.enabled) {
    return market.marketValue;
  }
  if (!householdValue) {
    return market.marketValue;
  }
  if (spec.householding.includeAccounts === "ALL") {
    return householdValue;
  }
  if (spec.householding.includeAccounts.includes(market.accountId)) {
    return householdValue;
  }
  return market.marketValue;
}

export function computeRate(input: RateComputationInput): RateComputationResult {
  const { schedule: spec, marketValue: market } = input;
  const components: FeeAccrualComponent[] = [];
  const accountBase = spec.valuation.includeCrypto
    ? market.marketValue + (market.cryptoMarketValue ?? 0)
    : market.marketValue;
  const pricingBaseSource = computeHouseheldValue(
    spec,
    market,
    input.householdValue
  );
  const pricingBase = spec.valuation.includeCrypto
    ? pricingBaseSource + (market.cryptoMarketValue ?? 0)
    : pricingBaseSource;
  if (pricingBase <= 0 || accountBase <= 0) {
    return { baseAmount: 0, effectiveBps: 0, components };
  }
  let effectiveBps = 0;
  switch (spec.base.method) {
    case "AUM_TIERED": {
      const tiers = [...(spec.base.tiers ?? [])];
      tiers.sort((a, b) => {
        const aUp = a.upTo ?? Number.POSITIVE_INFINITY;
        const bUp = b.upTo ?? Number.POSITIVE_INFINITY;
        return aUp - bUp;
      });
      let remaining = pricingBase;
      let lastCut = 0;
      let weightedRate = new Decimal(0);
      for (const tier of tiers) {
        const tierCap = tier.upTo ?? Number.POSITIVE_INFINITY;
        const slice = Math.min(pricingBase, tierCap) - lastCut;
        lastCut = Math.min(pricingBase, tierCap);
        if (slice <= 0) {
          continue;
        }
        const fraction = toDecimal(slice).div(pricingBase);
        weightedRate = weightedRate.plus(fraction.mul(tier.rateBps));
        const allocation = accountBase * fraction.toNumber();
        components.push({
          label: "BASE_TIER",
          detail: tier.upTo ? `Tier up to ${tier.upTo}` : "Overflow tier",
          amount: allocation,
          rateBps: tier.rateBps,
        });
        remaining -= slice;
        if (remaining <= 0) {
          break;
        }
      }
      effectiveBps = decimalToNumber(weightedRate);
      break;
    }
    case "FLAT": {
      if (!spec.base.flatAnnualUSD) {
        throw new Error("Flat fee requires flatAnnualUSD");
      }
      const rate = toDecimal(spec.base.flatAnnualUSD).div(pricingBase).mul(10000);
      effectiveBps = decimalToNumber(rate);
      components.push({
        label: "BASE_TIER",
        detail: "Flat fee",
        amount: accountBase,
        rateBps: effectiveBps,
      });
      break;
    }
    default:
      throw new Error(`Unsupported fee base method: ${spec.base.method}`);
  }

  let runningRate = new Decimal(effectiveBps);
  if (spec.discounts) {
    for (const discount of spec.discounts) {
      const discountBps = discount.bps ?? 0;
      if (discountBps !== 0) {
        runningRate = runningRate.minus(discountBps);
        components.push({
          label: "DISCOUNT",
          detail: discount.label,
          amount: -accountBase * (discountBps / 10000),
          rateBps: discountBps,
        });
      } else if (discount.amountUSD) {
        const amtRate = toDecimal(discount.amountUSD).div(pricingBase).mul(10000);
        runningRate = runningRate.minus(amtRate);
        components.push({
          label: "DISCOUNT",
          detail: discount.label,
          amount: -discount.amountUSD,
          rateBps: decimalToNumber(amtRate),
        });
      }
    }
  }

  if (spec.adders) {
    for (const adder of spec.adders) {
      const adderBps = adder.bps ?? 0;
      if (adderBps !== 0) {
        runningRate = runningRate.plus(adderBps);
        components.push({
          label: "ADDER",
          detail: adder.label,
          amount: accountBase * (adderBps / 10000),
          rateBps: adderBps,
        });
      } else if (adder.amountUSD) {
        const amtRate = toDecimal(adder.amountUSD).div(pricingBase).mul(10000);
        runningRate = runningRate.plus(amtRate);
        components.push({
          label: "ADDER",
          detail: adder.label,
          amount: adder.amountUSD,
          rateBps: decimalToNumber(amtRate),
        });
      }
    }
  }

  let capped = runningRate;
  if (spec.capBps !== undefined && spec.capBps !== null) {
    if (capped.greaterThan(spec.capBps)) {
      const beforeCap = capped;
      capped = toDecimal(spec.capBps);
      components.push({
        label: "CAP_ADJUSTMENT",
        detail: `Capped at ${spec.capBps}bps`,
        amount: 0,
        rateBps: decimalToNumber(beforeCap.minus(capped)),
      });
    }
  }

  return {
    baseAmount: accountBase,
    effectiveBps: decimalToNumber(capped),
    components,
  };
}

