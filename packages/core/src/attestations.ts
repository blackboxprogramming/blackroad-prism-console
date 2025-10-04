import type { AttestationRecord, ComplianceDb } from "@blackroad/compliance-db";
import { appendWorm } from "@blackroad/compliance-archival";

export interface RecordAttestationParams {
  db: ComplianceDb;
  policyKey: string;
  userId: string;
  period: "Annual" | "Initial" | "AdHoc";
  answers: unknown;
  signedAt?: Date;
}

export const recordAttestation = async ({
  db,
  policyKey,
  userId,
  period,
  answers,
  signedAt,
}: RecordAttestationParams): Promise<AttestationRecord> => {
  const policy = await db.policy.findByKey(policyKey);
  if (!policy) {
    throw new Error(`Unknown policy ${policyKey}`);
  }

  const attestation = await db.attestation.create({
    userId,
    policyId: policy.id,
    period,
    answers: {
      ...answers,
      policyVersion: policy.version,
    },
    signedAt: signedAt ?? new Date(),
  });

  await appendWorm({
    db,
    payload: {
      type: "attestation",
      policyKey,
      policyVersion: policy.version,
      attestationId: attestation.id,
      userId,
      period,
    },
  });

  return attestation;
};

export const needsFreshAttestation = async (
  db: ComplianceDb,
  policyKey: string,
  userId: string
): Promise<boolean> => {
  const policy = await db.policy.findByKey(policyKey);
  if (!policy) {
    throw new Error(`Unknown policy ${policyKey}`);
  }
  const latest = await db.attestation.findLatest(userId, policy.id);
  if (!latest) {
    return true;
  }
  const version = (latest.answers as any)?.policyVersion;
  return version !== policy.version;
};
