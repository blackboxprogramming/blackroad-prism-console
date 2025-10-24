import { AuditEvent } from '../../domain';
import { DeployAdapter, PlanStep, DeployResult } from '../types';

export const awsAdapter: DeployAdapter = {
  name: 'aws',
  async plan({ service, env, release }) {
    const steps: PlanStep[] = [
      { description: `Render ECS task definition for ${service.id}`, metadata: { sha: release.sha } },
      { description: `Push container image to ECR`, metadata: { repo: service.repo } },
      { description: `Update service in cluster ${env.cluster ?? 'default'}` }
    ];
    return steps;
  },
  async apply(plan, opts) {
    if (opts?.dryRun) {
      return { ok: true } satisfies DeployResult;
    }

    plan.forEach((step) => {
      opts?.onEvent?.(createAuditEvent('aws.plan', step));
    });

    return { ok: true } satisfies DeployResult;
  },
  async status() {
    return { state: 'active' };
  }
};

function createAuditEvent(action: string, step: PlanStep): AuditEvent {
  return {
    ts: new Date().toISOString(),
    actor: 'aws-adapter',
    action,
    subjectType: 'AdapterStep',
    subjectId: step.description,
    metadata: step.metadata ?? {}
  };
}
