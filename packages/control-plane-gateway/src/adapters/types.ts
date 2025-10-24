import { AuditEvent, Environment, Incident, Release, Service } from '../domain';

export interface PlanStep {
  description: string;
  metadata?: Record<string, unknown>;
}

export interface DeployResult {
  ok: boolean;
  releaseId?: string;
  error?: string;
}

export interface DeployStatus {
  state: 'idle' | 'deploying' | 'failed' | 'active';
  details?: string;
}

export interface DeployAdapter {
  name: 'aws' | 'fly' | 'gcp' | 'k8s' | 'render';
  plan(input: { service: Service; env: Environment; release: Release }): Promise<PlanStep[]>;
  apply(plan: PlanStep[], opts?: { dryRun?: boolean; onEvent?: (event: AuditEvent) => void }): Promise<DeployResult>;
  status(query: { serviceId: string; envId: string }): Promise<DeployStatus>;
}

export interface IncidentAdapter {
  name: 'stub' | 'pagerduty' | 'opsgenie';
  recent(input: { serviceId: string; limit?: number }): Promise<Incident[]>;
}
