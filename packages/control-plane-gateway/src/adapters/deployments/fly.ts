import { AuditEvent } from '../../domain';
import { DeployAdapter, PlanStep, DeployResult } from '../types';

export const flyAdapter: DeployAdapter = {
  name: 'fly',
  async plan({ service, release }) {
    const steps: PlanStep[] = [
      { description: `Generate fly.toml for ${service.id}` },
      { description: `Release ${release.sha} via fly deploy` }
    ];
    return steps;
  },
  async apply(plan, opts) {
    if (opts?.dryRun) {
      return { ok: true } satisfies DeployResult;
    }
    plan.forEach((step) => opts?.onEvent?.(emit(step)));
    return { ok: true } satisfies DeployResult;
  },
  async status() {
    return { state: 'idle', details: 'using stub status' };
  }
};

function emit(step: PlanStep): AuditEvent {
  return {
    ts: new Date().toISOString(),
    actor: 'fly-adapter',
    action: 'fly.plan',
    subjectType: 'AdapterStep',
    subjectId: step.description,
    metadata: step.metadata ?? {}
  };
}
