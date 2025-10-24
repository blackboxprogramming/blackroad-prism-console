export type ReleaseStatus = 'Draft' | 'Promoting' | 'Active' | 'Failed';

export interface Service {
  id: string;
  name: string;
  repo?: string;
  adapters: {
    deployments: string[];
  };
  environments: EnvironmentRef[];
}

export interface EnvironmentRef {
  id: string;
  name: string;
}

export interface Environment extends EnvironmentRef {
  region?: string;
  cluster?: string;
  policyRefs?: string[];
}

export interface Release {
  id: string;
  serviceId: string;
  sha: string;
  version?: string;
  envId: string;
  status: ReleaseStatus;
}

export interface WorkflowRunLogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: Record<string, unknown>;
}

export interface WorkflowRun {
  id: string;
  kind: 'Deploy' | 'Promote';
  actor: string;
  startedAt: string;
  finishedAt?: string;
  logs: WorkflowRunLogEntry[];
}

export interface Incident {
  id: string;
  serviceId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startedAt: string;
  status: string;
  link?: string;
}

export interface AuditEvent {
  ts: string;
  actor: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: Record<string, unknown>;
}

export interface DeployCreateInput {
  serviceId: string;
  envId: string;
  sha: string;
}

export interface DeployPromoteInput {
  releaseId: string;
  toEnvId: string;
}

export interface StatusSummary {
  service: Service;
  releases: Release[];
}
