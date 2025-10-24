import fs from 'fs';
import path from 'path';
import { AudioSource } from '../types';

export interface IngestResult {
  source: AudioSource;
  resolvedPath: string;
}

export async function ingest(source: AudioSource): Promise<IngestResult> {
  const isRemote = /^https?:/i.test(source.uri);

  if (!isRemote) {
    const absolutePath = path.resolve(source.uri);
    await fs.promises.access(absolutePath, fs.constants.R_OK);
    return { source, resolvedPath: absolutePath };
  }

  const tempDir = await fs.promises.mkdtemp(path.join(process.cwd(), 'captioner-'));
  const filename = path.join(tempDir, path.basename(source.uri));
  await fs.promises.writeFile(filename, `# placeholder download for ${source.uri}\n`);
  return { source, resolvedPath: filename };
}
