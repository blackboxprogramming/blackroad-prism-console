import { z } from "zod";
import { PolicyViolation } from "./types.js";

const DeliveryInput = z.object({
  clientId: z.string(),
  period: z.string(),
  deliveries: z.array(
    z.object({
      document: z.enum(["ADV", "FORM_CRS", "FEE_SCHEDULE"]),
      deliveredAt: z.date(),
    })
  ),
});

export function confirmDisclosureDelivery(input: {
  clientId: string;
  period: string;
  deliveries: { document: "ADV" | "FORM_CRS" | "FEE_SCHEDULE"; deliveredAt: Date }[];
}): PolicyViolation | null {
  const parsed = DeliveryInput.parse(input);
  const hasAdv = parsed.deliveries.some((delivery) => delivery.document === "ADV");
  const hasCrs = parsed.deliveries.some((delivery) => delivery.document === "FORM_CRS");
  if (hasAdv && hasCrs) {
    return null;
  }
  return {
    code: "DISCLOSURE_MISSING",
    severity: 60,
    message: `Missing ADV/CRS delivery evidence for ${parsed.clientId} in ${parsed.period}`,
  };
}

