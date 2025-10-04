export type Subject = "communication" | "client" | "employee" | "trade" | "vendor";

export interface EvalContext {
  state?: string;
  track?: string;
  date?: string;
}

export interface EvalInput<T = unknown> {
  subject: Subject;
  data: T;
  context: EvalContext;
}

export interface EvalResult {
  pass: boolean;
  riskScore: number;
  breaches: string[];
  requiredDisclosures?: string[];
  requiredEvidence?: string[];
  gateRecommendation?: "block" | "allow" | "review";
}

export interface PolicyEvaluator<T = unknown> {
  key: string;
  title: string;
  version: number;
  evaluate(input: EvalInput<T>): EvalResult;
}

export interface AttestationRequirement {
  policyKey: string;
  period: "Annual" | "Initial" | "AdHoc";
}
