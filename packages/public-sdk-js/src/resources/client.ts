import fetch, { RequestInit, Response } from 'node-fetch';
import { DeploysResource } from './deploys.js';
import { CaptionsResource } from './captions.js';
import { SimulationsResource } from './simulations.js';

export interface BlackRoadClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface BlackRoadClient {
  deploys: DeploysResource;
  captions: CaptionsResource;
  simulations: SimulationsResource;
}

export function createClient(options: BlackRoadClientOptions): BlackRoadClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const requester = async (path: string, init: RequestInit = {}) => {
    const url = new URL(path, options.baseUrl).toString();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    };
    const response = await fetchImpl(url, { ...init, headers });
    if (!response.ok) {
      const errorBody = await safeJson(response);
      throw new Error(`Request failed (${response.status}): ${JSON.stringify(errorBody)}`);
    }
    return safeJson(response);
  };

  return {
    deploys: new DeploysResource(requester),
    captions: new CaptionsResource(requester),
    simulations: new SimulationsResource(requester),
  };
}

type JsonFetcher = (path: string, init?: RequestInit) => Promise<unknown>;

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    return { error: 'invalid_json', raw: await response.text(), parseError: (error as Error).message };
  }
}

export type { JsonFetcher };
