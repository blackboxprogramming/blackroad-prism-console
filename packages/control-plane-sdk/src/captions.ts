export interface CaptionJob {
  id: string;
  assetId: string;
  backend: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  artifacts: Array<{ kind: string; url: string; bytes: number }>;
  error?: string;
}

export interface CaptionCreateInput {
  assetId: string;
  source: string;
  backend?: string;
  lang?: string;
}

export interface CaptionClientOptions {
  endpoint: string;
  token?: string;
  devToken?: string;
  fetchImpl?: typeof fetch;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class CaptionsClient {
  private readonly endpoint: string;
  private readonly token?: string;
  private readonly devToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CaptionClientOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token;
    this.devToken = options.devToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async create(input: CaptionCreateInput): Promise<CaptionJob> {
    const result = await this.request<{ captionCreate: CaptionJob }>(
      `mutation CaptionCreate($assetId: ID!, $source: String!, $backend: String, $lang: String) {
        captionCreate(assetId: $assetId, source: $source, backend: $backend, lang: $lang) {
          id
          assetId
          backend
          status
          createdAt
          updatedAt
          artifacts { kind url bytes }
          error
        }
      }`,
      input
    );
    return result.captionCreate;
  }

  async job(jobId: string): Promise<CaptionJob | null> {
    const result = await this.request<{ captionJob: CaptionJob | null }>(
      `query CaptionJob($id: ID!) {
        captionJob(id: $id) {
          id
          assetId
          backend
          status
          createdAt
          updatedAt
          artifacts { kind url bytes }
          error
        }
      }`,
      { id: jobId }
    );
    return result.captionJob;
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
      throw new Error(`Caption request failed: ${response.status} ${text}`);
    }

    const payload = (await response.json()) as GraphQLResponse<T>;
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join('; '));
    }
    if (!payload.data) {
      throw new Error('Caption gateway returned no data');
    }
    return payload.data;
  }
}

export default CaptionsClient;

export function createCaptionsSdk(options: CaptionClientOptions) {
  const client = new CaptionsClient(options);
  return {
    create(assetId: string, source: string, backend = 'local', lang = 'en') {
      return client.create({ assetId, source, backend, lang });
    },
    status(jobId: string) {
      return client.job(jobId);
    }
  };
}
