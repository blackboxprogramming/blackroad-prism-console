import { ensureDir, pathExists, readJSON, writeJSON } from 'fs-extra';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { AuditEvent, ControlPlaneState, Environment, Incident, Release, ReleaseStatus, Service } from './domain';

const STATE_PATH = join(process.cwd(), 'var', 'control-plane', 'state.json');

async function defaultState(): Promise<ControlPlaneState> {
  return {
    services: [],
    environments: [],
    releases: [],
    incidents: []
  };
}

export class ControlPlaneStore {
  private state: ControlPlaneState = { services: [], environments: [], releases: [], incidents: [] };

  async load() {
    if (await pathExists(STATE_PATH)) {
      this.state = await readJSON(STATE_PATH);
    } else {
      this.state = await defaultState();
      await this.persist();
    }
  }

  async persist() {
    await ensureDir(join(process.cwd(), 'var', 'control-plane'));
    await writeJSON(STATE_PATH, this.state, { spaces: 2 });
  }

  getServices(): Service[] {
    return this.state.services;
  }

  getService(id: string): Service | undefined {
    return this.state.services.find((service) => service.id === id);
  }

  upsertService(service: Service) {
    const existingIndex = this.state.services.findIndex((s) => s.id === service.id);
    if (existingIndex >= 0) {
      this.state.services[existingIndex] = service;
    } else {
      this.state.services.push(service);
    }
  }

  getEnvironment(id: string): Environment | undefined {
    return this.state.environments.find((env) => env.id === id);
  }

  upsertEnvironment(env: Environment) {
    const existingIndex = this.state.environments.findIndex((e) => e.id === env.id);
    if (existingIndex >= 0) {
      this.state.environments[existingIndex] = env;
    } else {
      this.state.environments.push(env);
    }
  }

  createRelease(input: { serviceId: string; envId: string; sha: string; version?: string; status?: ReleaseStatus }): Release {
    const release: Release = {
      id: `rel-${input.serviceId}-${input.envId}-${nanoid(6)}`,
      serviceId: input.serviceId,
      envId: input.envId,
      sha: input.sha,
      version: input.version,
      status: input.status ?? 'Draft'
    };
    this.state.releases.push(release);
    return release;
  }

  updateReleaseStatus(id: string, status: ReleaseStatus): Release {
    const release = this.state.releases.find((rel) => rel.id === id);
    if (!release) {
      throw new Error(`Release ${id} not found`);
    }
    release.status = status;
    return release;
  }

  getRelease(id: string): Release | undefined {
    return this.state.releases.find((rel) => rel.id === id);
  }

  listReleases(serviceId: string): Release[] {
    return this.state.releases.filter((release) => release.serviceId === serviceId);
  }

  listIncidents(serviceId: string, limit = 20): Incident[] {
    return this.state.incidents
      .filter((incident) => incident.serviceId === serviceId)
      .slice(0, limit);
  }

  upsertIncident(incident: Incident) {
    const index = this.state.incidents.findIndex((item) => item.id === incident.id);
    if (index >= 0) {
      this.state.incidents[index] = incident;
    } else {
      this.state.incidents.unshift(incident);
    }
  }

  auditMetadataForRelease(release: Release): Record<string, unknown> {
    return {
      serviceId: release.serviceId,
      envId: release.envId,
      sha: release.sha,
      status: release.status,
      version: release.version
    };
  }
}

export interface GatewayContext {
  store: ControlPlaneStore;
  principal: Principal;
  audit: AuditBus;
}

export interface Principal {
  id: string;
  roles: string[];
}

export interface AuditBus {
  publish(event: AuditEvent): Promise<void>;
  iterator(filter?: { serviceId?: string }): AsyncIterable<AuditEvent>;
  tail(limit?: number, filter?: { serviceId?: string }): AuditEvent[];
}
