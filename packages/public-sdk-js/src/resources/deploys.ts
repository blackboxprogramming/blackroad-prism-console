import type { RequestInit } from 'node-fetch';
import { randomUUID } from 'node:crypto';
import type { JsonFetcher } from './client.js';

const generateIdempotencyKey = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return randomUUID();
};

export interface CreateDeployInput {
  serviceId: string;
  environment: 'staging' | 'production';
  gitRef: string;
  metadata?: Record<string, unknown>;
}

export interface Deploy {
  releaseId: string;
  status: 'pending' | 'ready' | 'promoting' | 'promoted';
  auditId?: string;
}

export class DeploysResource {
  constructor(private readonly fetcher: JsonFetcher) {}

  create(input: CreateDeployInput): Promise<Deploy> {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Idempotency-Key': generateIdempotencyKey() },
      body: JSON.stringify(input),
    };
    return this.fetcher('/v1/deploys', init) as Promise<Deploy>;
  }

  promote(releaseId: string): Promise<{ releaseId: string; status: 'promoting' | 'promoted' }> {
    return this.fetcher(`/v1/releases/${releaseId}:promote`, { method: 'POST' }) as Promise<{
      releaseId: string;
      status: 'promoting' | 'promoted';
    }>;
  }
}
