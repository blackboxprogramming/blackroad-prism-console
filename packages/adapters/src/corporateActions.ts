import { readFile } from 'fs/promises';

export interface CorporateActionInput {
  instrumentId: string;
  exDate: string;
  type: string;
  factor?: number;
  details: Record<string, unknown>;
}

export async function loadCorporateAction(path: string): Promise<CorporateActionInput> {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as CorporateActionInput;
}
