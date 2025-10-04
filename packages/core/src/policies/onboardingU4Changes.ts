import { EvalInput, EvalResult, PolicyEvaluator } from "../types.js";

export interface U4ChangeEvent {
  changeDate: string;
  description: string;
  fields: Array<{
    field: string;
    from?: string | null;
    to?: string | null;
  }>;
  riskFlags?: string[];
}

const toDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const businessDaysBetween = (start: Date, end: Date): number => {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  let count = 0;
  while (s <= e) {
    const day = s.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    s.setDate(s.getDate() + 1);
  }
  return Math.max(0, count - 1);
};

const evaluateU4Changes = (input: EvalInput<U4ChangeEvent>): EvalResult => {
  const { data, context } = input;
  const evaluationDate = toDate(context.date) ?? new Date();
  const changeDate = toDate(data.changeDate) ?? evaluationDate;
  const isSdRisk = (data.riskFlags ?? []).some((flag) => flag.toLowerCase().includes("sd"));
  const dueBusinessDays = isSdRisk ? 10 : 30;
  const elapsedBusinessDays = businessDaysBetween(changeDate, evaluationDate);

  const breaches: string[] = [];
  if (elapsedBusinessDays > dueBusinessDays) {
    breaches.push("onboarding.u4.change_threshold");
  }
  if (isSdRisk) {
    breaches.push("onboarding.u4.sd_risk");
  }

  const pass = breaches.length === 0;
  const riskScore = pass ? (isSdRisk ? 40 : 20) : Math.min(95, 50 + breaches.length * 20);

  return {
    pass,
    riskScore,
    breaches,
    requiredEvidence: ["u4.change.summary"],
    gateRecommendation: pass ? "allow" : "review",
  };
};

export const onboardingU4ChangesEvaluator: PolicyEvaluator<U4ChangeEvent> = {
  key: "onboarding.u4_changes",
  title: "Onboarding Form U4 Change Detection",
  version: 1,
  evaluate: evaluateU4Changes,
};
