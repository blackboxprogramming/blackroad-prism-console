import { EvalInput, EvalResult, PolicyEvaluator } from "../types.js";

export interface AdvertisingPayload {
  title: string;
  contentUrl: string;
  containsPerformance?: boolean;
  performancePeriods?: string[];
  hypothetical?: boolean;
  containsTestimonials?: boolean;
  thirdPartyRatings?: boolean;
  cta?: string;
  disclosures?: string[];
  requiresProspectus?: boolean;
}

const CTA_BLOCK_LIST = ["buy", "purchase", "invest now", "act now"];

const normalize = (value: string): string => value.trim().toLowerCase();

const evaluateAdvertising = (input: EvalInput<AdvertisingPayload>): EvalResult => {
  const { data } = input;
  const breaches: string[] = [];
  const disclosures = new Set((data.disclosures ?? []).map(normalize));
  const requiredDisclosures: string[] = [];
  const requiredEvidence: string[] = [];

  if (data.containsTestimonials) {
    requiredDisclosures.push("testimonial_disclosure");
    if (!disclosures.has("testimonial_disclosure")) {
      breaches.push("ads.missing_testimonial_disclosure");
    }
  }

  if (data.containsPerformance) {
    requiredEvidence.push("performance_backing");
    requiredDisclosures.push("net_gross_disclosure");
    if (!data.performancePeriods?.length) {
      breaches.push("ads.performance_missing_period");
    }
    if (!disclosures.has("net_gross_disclosure")) {
      breaches.push("ads.performance_missing_disclosure");
    }
  }

  if (data.hypothetical) {
    requiredDisclosures.push("hypothetical_label");
    breaches.push("ads.hypothetical_flag");
  }

  if (data.thirdPartyRatings) {
    requiredDisclosures.push("third_party_rating_methodology");
    if (!disclosures.has("third_party_rating_methodology")) {
      breaches.push("ads.third_party_rating_disclosure");
    }
  }

  if (data.requiresProspectus || data.containsPerformance) {
    requiredDisclosures.push("prospectus_reference");
    if (!disclosures.has("prospectus_reference")) {
      breaches.push("ads.prospectus_missing");
    }
  }

  if (data.cta) {
    const cta = normalize(data.cta);
    if (CTA_BLOCK_LIST.some((phrase) => cta.includes(phrase))) {
      breaches.push("ads.cta_blocked");
    }
  }

  breaches.sort();
  const pass = breaches.length === 0;
  const riskScore = pass ? (data.containsPerformance || data.containsTestimonials ? 25 : 10) : Math.min(90, 30 + breaches.length * 15);

  const gateRecommendation = breaches.includes("ads.cta_blocked") ? "block" : pass ? "allow" : "review";

  return {
    pass,
    riskScore,
    breaches,
    requiredDisclosures: Array.from(new Set(requiredDisclosures.map(normalize))),
    requiredEvidence,
    gateRecommendation,
  };
};

export const adsMarketingRuleEvaluator: PolicyEvaluator<AdvertisingPayload> = {
  key: "ads.marketing_rule",
  title: "Advertising and Marketing Rule Controls",
  version: 1,
  evaluate: evaluateAdvertising,
};
