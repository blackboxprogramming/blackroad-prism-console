import type { RegDeskRepository } from '../utils/repository.js';
import type { AuditPayload } from '../types.js';

export async function appendAuditLog(repo: RegDeskRepository, payload: AuditPayload) {
  await repo.appendWormBlock({ ...payload, ts: new Date().toISOString() });
}

export async function exportAuditChain(
  repo: RegDeskRepository,
  range?: Partial<{ fromIdx: number; toIdx: number }>
) {
  const blocks = await repo.listWormBlocks(range);
  return blocks;
}
