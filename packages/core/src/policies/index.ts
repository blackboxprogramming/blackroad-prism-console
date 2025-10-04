import { PolicyEvaluator } from "../types.js";
import { adsMarketingRuleEvaluator } from "./adsMarketingRule.js";
import { onboardingU4ChangesEvaluator } from "./onboardingU4Changes.js";
import {
  amlCoreEvaluator,
  ceTrackerEvaluator,
  complaintsIntakeEvaluator,
  giftsEntertainmentEvaluator,
  obaPstEvaluator,
  p2pContributionsEvaluator,
  privacySpBcpEvaluator,
  vendorDdqEvaluator,
} from "./stubs.js";

const evaluators: PolicyEvaluator[] = [
  adsMarketingRuleEvaluator,
  onboardingU4ChangesEvaluator,
  amlCoreEvaluator,
  ceTrackerEvaluator,
  giftsEntertainmentEvaluator,
  obaPstEvaluator,
  p2pContributionsEvaluator,
  complaintsIntakeEvaluator,
  vendorDdqEvaluator,
  privacySpBcpEvaluator,
];

const registry = new Map<string, PolicyEvaluator>();
for (const evaluator of evaluators) {
  registry.set(evaluator.key, evaluator);
}

export const listEvaluators = (): PolicyEvaluator[] => Array.from(registry.values());

export const getEvaluator = (key: string): PolicyEvaluator => {
  const evaluator = registry.get(key);
  if (!evaluator) {
    throw new Error(`Unknown policy evaluator: ${key}`);
  }
  return evaluator;
};

export const evaluatePolicy = (key: string, input: Parameters<PolicyEvaluator["evaluate"]>[0]) => {
  return getEvaluator(key).evaluate(input);
};

export type { AdvertisingPayload } from "./adsMarketingRule.js";
export type { U4ChangeEvent } from "./onboardingU4Changes.js";
