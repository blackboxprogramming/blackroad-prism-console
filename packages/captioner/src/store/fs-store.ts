import fs from 'fs';
import path from 'path';
import { CaptionArtifact } from '../types';

export interface FsStoreOptions {
  baseDir?: string;
}

export class FsStore {
  private readonly baseDir: string;

  constructor(options: FsStoreOptions = {}) {
    this.baseDir = options.baseDir ?? path.join(process.cwd(), 'caption-artifacts');
  }

  async writeArtifact(jobId: string, artifactName: string, contents: string): Promise<CaptionArtifact> {
    const dir = path.join(this.baseDir, jobId);
    await fs.promises.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, artifactName);
    await fs.promises.writeFile(filePath, contents, 'utf8');
    const stats = await fs.promises.stat(filePath);
    return { kind: path.extname(artifactName).slice(1) as CaptionArtifact['kind'], path: filePath, bytes: stats.size };
  }
}

export default FsStore;
