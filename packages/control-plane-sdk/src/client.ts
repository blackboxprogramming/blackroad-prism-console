import { CaptionsClient } from './captions';
import { AuditEvent, DeployCreateInput, DeployPromoteInput, Incident, Release, Service, StatusSummary } from './types';

export interface ControlPlaneClientOptions {
  endpoint: string;
  token?: string;
  devToken?: string;
  fetchImpl?: typeof fetch;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class ControlPlaneClient {
  private readonly endpoint: string;
  private readonly token?: string;
  private readonly devToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ControlPlaneClientOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token;
    this.devToken = options.devToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async deployCreate(input: DeployCreateInput): Promise<{ release: Release; audit: AuditEvent }> {
    const result = await this.request<{ deployCreate: { release: Release; audit: AuditEvent } }>(
      `mutation DeployCreate($serviceId: ID!, $envId: ID!, $sha: String!) {
        deployCreate(serviceId: $serviceId, envId: $envId, sha: $sha) {
          release { id serviceId sha version envId status }
          audit { ts actor action subjectType subjectId metadata }
        }
      }`,
      input
    );
    return result.deployCreate;
  }

  async deployPromote(input: DeployPromoteInput): Promise<{ release: Release; audit: AuditEvent }> {
    const result = await this.request<{ deployPromote: { release: Release; audit: AuditEvent } }>(
      `mutation DeployPromote($releaseId: ID!, $toEnvId: ID!) {
        deployPromote(releaseId: $releaseId, toEnvId: $toEnvId) {
          release { id serviceId sha version envId status }
          audit { ts actor action subjectType subjectId metadata }
        }
      }`,
      input
    );
    return result.deployPromote;
  }

  async serviceStatus(serviceId: string): Promise<StatusSummary> {
    const result = await this.request<{ service: Service | null; releases: Release[] }>(
      `query ServiceStatus($serviceId: ID!) {
        service(id: $serviceId) {
          id
          name
          repo
          adapters { deployments }
          environments { id name }
        }
        releases(serviceId: $serviceId) {
          id
          serviceId
          sha
          version
          envId
          status
        }
      }`,
      { serviceId }
    );

    if (!result.service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    return { service: result.service, releases: result.releases };
  }

  async recentIncidents(serviceId: string, limit = 20): Promise<Incident[]> {
    const result = await this.request<{ incidents: Incident[] }>(
      `query RecentIncidents($serviceId: ID!, $limit: Int) {
        incidents(serviceId: $serviceId, limit: $limit) {
          id
          serviceId
          severity
          startedAt
          status
          link
        }
      }`,
      { serviceId, limit }
    );
    return result.incidents;
  }

  async auditTail(serviceId?: string, limit = 20): Promise<AuditEvent[]> {
    const result = await this.request<{ auditTail: AuditEvent[] }>(
      `query AuditTail($serviceId: ID, $limit: Int) {
        auditTail(serviceId: $serviceId, limit: $limit) {
          ts
          actor
          action
          subjectType
          subjectId
          metadata
        }
      }`,
      { serviceId, limit }
    );
    return result.auditTail;
  }

  captions(): CaptionsClient {
    return new CaptionsClient({
      endpoint: this.endpoint,
      token: this.token,
      devToken: this.devToken,
      fetchImpl: this.fetchImpl
    });
  }

  private async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(this.devToken ? { 'X-Dev-Token': this.devToken } : {})
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gateway request failed: ${response.status} ${text}`);
    }

    const payload = (await response.json()) as GraphQLResponse<T>;
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join('; '));
    }

    if (!payload.data) {
      throw new Error('Gateway returned no data');
    }

    return payload.data;
  }
}

export default ControlPlaneClient;
