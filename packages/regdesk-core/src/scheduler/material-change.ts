import type { CompliancePolicy } from '@blackroad/regdesk-integrations';
import { appendAuditLog } from '../audit/worm.js';
import type { RegDeskRepository } from '../utils/repository.js';

export interface MaterialChangeOptions {
  policy: CompliancePolicy;
  repo: RegDeskRepository;
  actor: string;
}

export async function createMaterialChangeEvents({ policy, repo, actor }: MaterialChangeOptions) {
  const due = new Date(policy.effectiveDate);
  const key = policy.materialToClients
    ? 'ADV-CRS-MATERIAL-DELIVERY'
    : 'ADV-CRS-INTERNAL-UPDATE';
  const existing = await repo.findRegEventByKeyAndDue(key, due);
  if (existing) {
    return existing;
  }
  const event = await repo.upsertRegEvent({
    key,
    track: 'RIA',
    stateCode: null,
    frequency: 'ADHOC',
    due,
    opensAt: due,
    closesAt: undefined,
    status: 'Open',
    blockers: []
  });
  await appendAuditLog(repo, {
    actor,
    action: 'schedule.materialChange',
    entity: event.id,
    policyId: policy.id,
    version: policy.version
  });
  return event;
}
