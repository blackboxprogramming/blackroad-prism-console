import { ipc } from './fs';

export async function exportBundle() {
  return ipc.exportBundle();
}

export async function importBundle(path: string) {
  return ipc.importBundle({ path });
}
