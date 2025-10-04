import { PolicyEvaluator } from "../types.js";

const passResult = {
  pass: true,
  riskScore: 5,
  breaches: [],
  gateRecommendation: "allow" as const,
};

export const amlCoreEvaluator: PolicyEvaluator = {
  key: "aml.core",
  title: "AML / KYC Baseline",
  version: 1,
  evaluate: () => ({ ...passResult }),
};

export const ceTrackerEvaluator: PolicyEvaluator = {
  key: "ce.tracker",
  title: "Continuing Education Tracker",
  version: 1,
  evaluate: () => ({ ...passResult }),
};

export const giftsEntertainmentEvaluator: PolicyEvaluator = {
  key: "gifts.entertainment",
  title: "Gifts and Entertainment Thresholds",
  version: 1,
  evaluate: () => ({ ...passResult }),
};

export const obaPstEvaluator: PolicyEvaluator = {
  key: "oba.pst",
  title: "Outside Business Activities and PST",
  version: 1,
  evaluate: () => ({ ...passResult, gateRecommendation: "review" }),
};

export const p2pContributionsEvaluator: PolicyEvaluator = {
  key: "p2p.contributions",
  title: "Pay-to-Play Monitoring",
  version: 1,
  evaluate: () => ({ ...passResult }),
};

export const complaintsIntakeEvaluator: PolicyEvaluator = {
  key: "complaints.intake",
  title: "Complaint Intake Controls",
  version: 1,
  evaluate: () => ({ ...passResult }),
};

export const vendorDdqEvaluator: PolicyEvaluator = {
  key: "vendor.ddq",
  title: "Vendor and Partner Due Diligence",
  version: 1,
  evaluate: () => ({ ...passResult }),
};

export const privacySpBcpEvaluator: PolicyEvaluator = {
  key: "privacy.sp_bcp",
  title: "Privacy / Reg S-P / BCP Controls",
  version: 1,
  evaluate: () => ({ ...passResult }),
};
