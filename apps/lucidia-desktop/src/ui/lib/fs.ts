import { invoke } from '@tauri-apps/api/tauri';

export const readJsonFile = async <T>(path: string): Promise<T | null> => {
  const response = await invoke('read_json', { path });
  return response as T | null;
};

export const writeJsonFile = async <T>(path: string, data: T): Promise<void> => {
  await invoke('write_json', { path, data });
};
