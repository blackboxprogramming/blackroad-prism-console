import type { ComplianceDb, PolicyRecord, PolicyStatus, UserRecord } from "@blackroad/compliance-db";
import { appendWorm } from "@blackroad/compliance-archival";

export interface PublishPolicyParams {
  db: ComplianceDb;
  actor: Pick<UserRecord, "id" | "role" | "name">;
  key: string;
  title: string;
  body: unknown;
  controls: string[];
  effectiveAt: Date;
  status?: PolicyStatus;
}

export const publishPolicy = async ({
  db,
  actor,
  key,
  title,
  body,
  controls,
  effectiveAt,
  status = "Active",
}: PublishPolicyParams): Promise<PolicyRecord> => {
  if (actor.role !== "admin") {
    throw new Error("Only administrators can publish policies");
  }

  const existing = await db.policy.findByKey(key);
  let supersedesId: string | undefined;
  let version = 1;

  if (existing) {
    supersedesId = existing.id;
    version = existing.version + 1;
    await db.policy.update(existing.id, { status: "Retired" });
  }

  const record = await db.policy.create({
    key,
    title,
    version,
    status,
    body,
    controls,
    effectiveAt,
    supersedesId,
  });

  await appendWorm({
    db,
    payload: {
      type: "policy",
      policyId: record.id,
      key,
      version,
      status,
      supersedesId,
    },
  });

  return record;
};
