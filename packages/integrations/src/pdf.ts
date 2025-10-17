import { InvoiceDraft } from "@lucidia/core";

export interface PdfRenderResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export async function renderInvoicePdf(invoice: InvoiceDraft): Promise<PdfRenderResult> {
  const content = JSON.stringify(invoice, null, 2);
  return {
    buffer: Buffer.from(content, "utf-8"),
    contentType: "application/pdf",
    filename: `invoice-${invoice.accountId ?? invoice.billingGroupId}.pdf`,
  };
}

