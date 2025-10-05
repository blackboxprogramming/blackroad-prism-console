import { v4 as uuid } from "uuid";
import { AccountFeePlan } from "@lucidia/core";

export interface CustodyDeductionRequest {
  plan: AccountFeePlan;
  invoiceId: string;
  amount: number;
  currency: string;
  evidenceUri?: string;
}

export interface CustodyDeductionReceipt {
  id: string;
  status: "Submitted" | "Confirmed";
  submittedAt: Date;
  confirmationRef?: string;
}

export async function submitCustodyDeduction(
  request: CustodyDeductionRequest
): Promise<CustodyDeductionReceipt> {
  return {
    id: uuid(),
    status: "Submitted",
    submittedAt: new Date(),
  };
}

