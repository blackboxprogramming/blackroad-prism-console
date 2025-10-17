export interface PolicyViolation {
  code: "CAP_EXCEEDED" | "NO_AUTH" | "PERF_NOT_ELIGIBLE" | "MF_COMMISSION_REBATE" | "DISCLOSURE_MISSING";
  severity: number;
  message: string;
  details?: Record<string, unknown>;
}

