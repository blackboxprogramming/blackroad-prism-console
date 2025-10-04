export interface CustodyPacketInput {
  custodian: string;
  accountApp: Record<string, unknown>;
}

export function buildPacket(input: CustodyPacketInput): Buffer {
  const payload = JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      custodian: input.custodian,
      accountApp: input.accountApp,
    },
    null,
    2,
  );
  return Buffer.from(payload, "utf-8");
}
