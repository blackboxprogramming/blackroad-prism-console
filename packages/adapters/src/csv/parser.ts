import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { load } from 'yaml';

export interface CsvMapping {
  type: 'positions' | 'cash' | 'transactions';
  columns: Record<string, string>;
  defaults?: Record<string, unknown>;
}

export interface CsvConfig {
  name: string;
  mappings: CsvMapping[];
}

export async function loadConfig(path: string): Promise<CsvConfig> {
  const content = await readFile(path, 'utf-8');
  return load(content) as CsvConfig;
}

export function parseCsv<T = Record<string, unknown>>(filePath: string): Promise<T[]> {
  return readFile(filePath, 'utf-8').then((content) => parse(content, { columns: true, skip_empty_lines: true }) as T[]);
}
