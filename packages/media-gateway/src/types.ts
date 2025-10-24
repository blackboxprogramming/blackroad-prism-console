export type CaptionJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export interface CaptionArtifact {
  kind: string;
  url: string;
  bytes: number;
}

export interface CaptionJob {
  id: string;
  assetId: string;
  backend: string;
  status: CaptionJobStatus;
  createdAt: string;
  updatedAt: string;
  artifacts: CaptionArtifact[];
  error?: string;
}

export interface CaptionCreateInput {
  assetId: string;
  source: string;
  backend?: string;
  lang?: string;
}
