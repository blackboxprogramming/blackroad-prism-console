import type { ComplianceDb } from "@blackroad/compliance-db";
import { appendWorm } from "@blackroad/compliance-archival";
import { describeBreach } from "./breaches.js";

export interface GateContext {
  [key: string]: unknown;
}

export interface GateResult {
  allowed: boolean;
  reason?: string;
  requiredEvidence?: string[];
}

const gateHandlers: Record<string, (context: GateContext) => GateResult> = {
  advise: (context) => {
    if (context.ceCompleted === false) {
      return {
        allowed: false,
        reason: describeBreach("gate.ce_incomplete"),
        requiredEvidence: ["ce.completion_certificate"],
      };
    }
    return { allowed: true };
  },
  send_ad: () => ({ allowed: true }),
  open_account: () => ({ allowed: true }),
  trade_bd: () => ({ allowed: true }),
  sell_insurance: () => ({ allowed: true }),
};

export const gate = async (
  db: ComplianceDb,
  action: keyof typeof gateHandlers | (string & {}),
  context: GateContext
): Promise<GateResult> => {
  const handler = gateHandlers[action] ?? (() => ({ allowed: true }));
  const result = handler(context);
  const record = await db.gate.create({
    action,
    context,
    allowed: result.allowed,
    reason: result.reason,
  });

  await appendWorm({
    db,
    payload: {
      type: "gate",
      gateId: record.id,
      action,
      allowed: result.allowed,
      reason: result.reason,
      context,
    },
  });

  return result;
};
