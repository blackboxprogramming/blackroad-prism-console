import { PolicyContext } from "./types.js";

export const DEFAULT_POLICY_CONTEXT: PolicyContext = {
  sodSeverityThreshold: 70,
  recertGraceDays: 7,
  vendorCriticalRiskThreshold: 75,
  defaultRecertIntervalDays: 90,
  bcPlanTestCadenceDays: 365,
  privacyNotificationHours: 72,
  fourEyesActions: new Set([
    "ads.publish",
    "billing.issue",
    "payments.post",
  ]),
};

export const PERMISSION_CATALOG: Record<string, string> = {
  "ads.approve": "Approve advertising content",
  "ads.publish": "Publish advertising content",
  "billing.issue": "Issue invoices",
  "payments.post": "Post customer payments",
  "surv.close_case": "Close surveillance cases",
  "regdesk.file": "File regulatory forms",
  "clientos.enable_options": "Enable options trading",
  "custody.deduction": "Submit custody deductions",
  "change.deploy": "Deploy platform changes",
};

export function baseRiskForRfc(type: string): number {
  switch (type) {
    case "CODE":
      return 30;
    case "POLICY":
      return 25;
    case "INFRA":
      return 35;
    case "CONTENT":
      return 15;
    default:
      return 20;
  }
}

export interface RiskInputs {
  impact: "Low" | "Medium" | "High" | "Critical";
  rollbackComplexity: "Low" | "Medium" | "High";
  touchesPii?: boolean;
  touchesVendors?: boolean;
}

export function computeRiskScore(type: string, inputs: RiskInputs): number {
  const base = baseRiskForRfc(type);
  const impactScores: Record<RiskInputs["impact"], number> = {
    Low: 5,
    Medium: 15,
    High: 25,
    Critical: 35,
  };
  const rollbackScores: Record<RiskInputs["rollbackComplexity"], number> = {
    Low: 5,
    Medium: 10,
    High: 20,
  };
  let score = base + impactScores[inputs.impact] + rollbackScores[inputs.rollbackComplexity];
  if (inputs.touchesPii) {
    score += 10;
  }
  if (inputs.touchesVendors) {
    score += 5;
  }
  return Math.min(100, score);
}
