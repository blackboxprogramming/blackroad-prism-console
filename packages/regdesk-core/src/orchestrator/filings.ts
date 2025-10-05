import type { Filing, RegEvent, Rulepack } from '@blackroad/regdesk-db';
import type { Rule } from '@blackroad/regdesk-rules';
import type {
  ComplianceOSClient,
  IARDClient,
  LicenseMatrixClient,
  StatePortalClient
} from '@blackroad/regdesk-integrations';
import { appendAuditLog } from '../audit/worm.js';
import type { FilingArtifact } from '../types.js';
import type { RegDeskRepository } from '../utils/repository.js';
import { filingArtifactSchema } from '../utils/repository.js';

export interface FilingBuilderDependencies {
  repo: RegDeskRepository;
  licenseMatrix: LicenseMatrixClient;
  compliance: ComplianceOSClient;
  iard: IARDClient;
  statePortal: StatePortalClient;
  actor: string;
}

export class FilingService {
  constructor(private readonly deps: FilingBuilderDependencies) {}

  async build(regEvent: RegEvent, rule: Rule): Promise<Filing> {
    if (!rule.filing || rule.filing.type === 'NONE') {
      throw new Error(`Rule ${rule.key} does not require a filing`);
    }
    const payload = await this.composePayload(regEvent, rule);
    const filing = await this.deps.repo.createFiling({
      regEventId: regEvent.id,
      type: this.mapFilingType(rule.filing.type),
      payload,
      artifacts: [],
      feeCents: null,
      status: 'Draft',
      submittedAt: null,
      receiptPath: null
    });
    await appendAuditLog(this.deps.repo, {
      actor: this.deps.actor,
      action: 'filing.build',
      entity: filing.id,
      eventKey: regEvent.key
    });
    return filing;
  }

  async attachArtifacts(filingId: string, artifacts: FilingArtifact[]): Promise<Filing> {
    filingArtifactSchema.parse(artifacts);
    const filing = await this.deps.repo.updateFiling(filingId, {
      artifacts: artifacts as unknown as Record<string, unknown>
    });
    await appendAuditLog(this.deps.repo, {
      actor: this.deps.actor,
      action: 'filing.artifact.attach',
      entity: filingId,
      artifactCount: artifacts.length
    });
    return filing;
  }

  async submit(filingId: string): Promise<Filing> {
    const filing = await this.deps.repo.updateFiling(filingId, {});
    const artifacts = filing.artifacts as unknown as FilingArtifact[];
    if (!artifacts || !artifacts.length) {
      throw new Error('Cannot submit filing without artifacts');
    }
    const regEvent = (await this.deps.repo.listRegEvents()).find(
      (event) => event.id === filing.regEventId
    );
    if (!regEvent) {
      throw new Error('Linked RegEvent not found');
    }
    const rulepack = await this.deps.repo.getRulepackByKey(regEvent.key.split('-').slice(0, 2).join('-'));
    const submissionResult = await this.dispatchSubmission(filing, regEvent, rulepack ?? null);
    const updated = await this.deps.repo.updateFiling(filingId, {
      status: submissionResult.status === 'ACCEPTED' ? 'Accepted' : 'Submitted',
      submittedAt: new Date(),
      receiptPath: submissionResult.receiptPath ?? filing.receiptPath
    });
    if (submissionResult.status === 'ACCEPTED') {
      await this.deps.repo.updateRegEventStatus(regEvent.id, 'Accepted');
    }
    await appendAuditLog(this.deps.repo, {
      actor: this.deps.actor,
      action: 'filing.submit',
      entity: filingId,
      status: updated.status,
      receiptPath: updated.receiptPath
    });
    return updated;
  }

  private async composePayload(regEvent: RegEvent, rule: Rule): Promise<Record<string, unknown>> {
    const [licenses, policies] = await Promise.all([
      this.deps.licenseMatrix.getLicenses(),
      this.deps.compliance.listPolicies()
    ]);
    const licenseDetails = licenses.filter((license) => {
      if (rule.stateCode) {
        return license.stateCode === rule.stateCode && license.track === rule.track;
      }
      return license.track === rule.track;
    });
    const relevantPolicies = policies.filter((policy) => policy.materialToClients);
    return {
      regEventKey: regEvent.key,
      due: regEvent.due.toISOString(),
      forms: rule.filing?.formKeys ?? [],
      licenses: licenseDetails,
      policies: relevantPolicies.map((policy) => ({
        id: policy.id,
        version: policy.version,
        effectiveDate: policy.effectiveDate
      }))
    };
  }

  private mapFilingType(type: Rule['filing']['type']): Filing['type'] {
    switch (type) {
      case 'IARD':
        return 'IARD';
      case 'CRD':
        return 'CRD';
      case 'STATE_PORTAL':
        return 'STATE_INS';
      default:
        return 'ADHOC';
    }
  }

  private async dispatchSubmission(
    filing: Filing,
    regEvent: RegEvent,
    rulepack: Rulepack | null
  ) {
    switch (filing.type) {
      case 'IARD': {
        const fee = await this.deps.iard.calculateFees(filing.payload as Record<string, unknown>);
        await this.deps.repo.updateFiling(filing.id, { feeCents: fee });
        return this.deps.iard.submit(filing.payload as Record<string, unknown>);
      }
      case 'STATE_INS': {
        const state = regEvent.stateCode ?? 'NA';
        return this.deps.statePortal.submit(state, filing.payload as Record<string, unknown>);
      }
      default:
        return { status: 'SUBMITTED' as const };
    }
  }
}
