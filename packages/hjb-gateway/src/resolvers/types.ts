export type HjbJobKind = 'PDE' | 'MDP' | 'ROLLOUT';

export interface HjbArtifact {
  name: string;
  path: string;
}

export interface HjbJob {
  id: string;
  kind: HjbJobKind;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  config: unknown;
  metrics?: Record<string, unknown>;
  artifacts: HjbArtifact[];
  error?: string;
}

interface JobRecord {
  job: HjbJob;
  data?: unknown;
}

export class HjbJobStore {
  private readonly jobs = new Map<string, JobRecord>();
  private sequence = 0;

  create(kind: HjbJobKind, config: unknown): HjbJob {
    const id = `job-${++this.sequence}`;
    const now = new Date().toISOString();
    const job: HjbJob = {
      id,
      kind,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      config,
      artifacts: []
    };
    this.jobs.set(id, { job });
    return job;
  }

  update(id: string, updates: Partial<HjbJob>): HjbJob {
    const record = this.jobs.get(id);
    if (!record) {
      throw new Error(`Job ${id} not found`);
    }
    record.job = { ...record.job, ...updates, updatedAt: new Date().toISOString() };
    this.jobs.set(id, record);
    return record.job;
  }

  attachData(id: string, data: unknown) {
    const record = this.jobs.get(id);
    if (!record) {
      throw new Error(`Job ${id} not found`);
    }
    record.data = data;
    this.jobs.set(id, record);
  }

  get(id: string): HjbJob | undefined {
    return this.jobs.get(id)?.job;
  }

  getData<T = unknown>(id: string): T | undefined {
    return this.jobs.get(id)?.data as T | undefined;
  }
}

export interface GatewayContext {
  role: 'viewer' | 'operator' | 'admin';
}
