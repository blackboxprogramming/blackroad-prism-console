import type { RequestInit } from 'node-fetch';
import type { JsonFetcher } from './client.js';

export interface CaptionJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  submittedAt?: string;
  artifacts?: CaptionArtifact[];
}

export interface CaptionArtifact {
  type: 'vtt' | 'srt' | 'txt';
  url: string;
  checksum?: string;
}

export interface CreateCaptionJobInput {
  assetUrl: string;
  sourceLanguage: string;
  targetLanguages: string[];
  backend?: 'native' | 'premium' | 'experimental';
}

export class CaptionsResource {
  constructor(private readonly fetcher: JsonFetcher) {}

  create(input: CreateCaptionJobInput): Promise<{ jobId: string; status: string; estimatedCompletionSeconds: number }> {
    const init: RequestInit = {
      method: 'POST',
      body: JSON.stringify(input),
    };
    return this.fetcher('/v1/captions', init) as Promise<{
      jobId: string;
      status: string;
      estimatedCompletionSeconds: number;
    }>;
  }

  get(jobId: string): Promise<CaptionJob> {
    return this.fetcher(`/v1/captions/${jobId}`) as Promise<CaptionJob>;
  }

  listArtifacts(jobId: string): Promise<{ jobId: string; artifacts: CaptionArtifact[] }> {
    return this.fetcher(`/v1/captions/${jobId}/artifacts`) as Promise<{ jobId: string; artifacts: CaptionArtifact[] }>;
  }
}
