import { v4 as uuid } from "uuid";

export type ExternalPaymentMethod = "ACH" | "Wire" | "Check" | "Crypto";

export interface ExternalPaymentRequest {
  invoiceId: string;
  method: ExternalPaymentMethod;
  amount: number;
  currency: string;
  reference?: string;
}

export interface ExternalPaymentReceipt {
  id: string;
  status: "Pending" | "Settled" | "Failed";
  postedAt: Date;
  failureReason?: string;
}

export async function recordExternalPayment(
  request: ExternalPaymentRequest
): Promise<ExternalPaymentReceipt> {
  return {
    id: uuid(),
    status: "Settled",
    postedAt: new Date(),
  };
}

