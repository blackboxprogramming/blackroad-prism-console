import { createHash, createHmac } from 'crypto';
import { readFileSync, statSync } from 'fs';

export interface HashedArtifact {
  bytes: number;
  hash: string;
}

export function hashArtifact(filePath: string): HashedArtifact {
  const buffer = readFileSync(filePath);
  const hash = createHash('sha256').update(buffer).digest('hex');
  const stats = statSync(filePath);
  return { hash, bytes: stats.size };
}

export function signEvidence(simulationId: string, modelVersion: string, evidenceHash: string): string {
  const signingKey = process.env.ECONOMY_SIGNING_KEY ?? 'dev-signing-key';
  return createHmac('sha256', signingKey)
    .update(`${modelVersion}:${simulationId}:${evidenceHash}`)
    .digest('hex');
}
