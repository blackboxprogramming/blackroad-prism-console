import JSZip from 'jszip';
import { invoke } from '@tauri-apps/api/tauri';

interface BundleMetadata {
  memory: number;
  tasks: number;
  settings: boolean;
}

export const exportBundle = async (): Promise<{ path: string }> => {
  return (await invoke('export_bundle')) as { path: string };
};

export const importBundle = async (archive: ArrayBuffer): Promise<BundleMetadata> => {
  const zip = await JSZip.loadAsync(archive);
  const manifest = await zip.file('manifest.json')?.async('string');
  if (!manifest) {
    throw new Error('Invalid bundle: missing manifest');
  }
  const parsed = JSON.parse(manifest);
  const result = await invoke('import_bundle', { payload: parsed });
  return result as BundleMetadata;
};
import { ipc } from './fs';

export async function exportBundle() {
  return ipc.exportBundle();
}

export async function importBundle(path: string) {
  return ipc.importBundle({ path });
}
