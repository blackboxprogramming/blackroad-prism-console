import type {
  DeliveryLog,
  Filing,
  Gate,
  RegEvent,
  Rulepack,
  WormBlock
} from '@blackroad/regdesk-db';
import { createBlock, verifyChain, type WormBlock as WormEntry } from '@blackroad/regdesk-worm';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export interface RegDeskRepository {
  upsertRulepack(input: Omit<Rulepack, 'id' | 'updatedAt'>): Promise<Rulepack>;
  listRulepacks(): Promise<Rulepack[]>;
  getRulepackByKey(key: string): Promise<Rulepack | null>;
  findRulepacks(keys: string[]): Promise<Rulepack[]>;

  findRegEventByKeyAndDue(key: string, due: Date): Promise<RegEvent | null>;
  upsertRegEvent(event: Omit<RegEvent, 'id' | 'createdAt'> & { id?: string }): Promise<RegEvent>;
  listRegEvents(filter?: Partial<{ status: RegEvent['status']; track: RegEvent['track'] }>): Promise<
    RegEvent[]
  >;
  updateRegEventStatus(
    id: string,
    status: RegEvent['status'],
    data?: Partial<Pick<RegEvent, 'opensAt' | 'closesAt' | 'blockers'>>
  ): Promise<RegEvent>;

  createFiling(filing: Omit<Filing, 'id' | 'createdAt'>): Promise<Filing>;
  updateFiling(id: string, data: Partial<Filing>): Promise<Filing>;
  listFilingsForEvent(eventId: string): Promise<Filing[]>;

  createDeliveryLog(log: Omit<DeliveryLog, 'id' | 'createdAt'>): Promise<DeliveryLog>;
  listDeliveryLogs(filter: Partial<{ docKind: DeliveryLog['docKind']; clientId: string }>): Promise<
    DeliveryLog[]
  >;

  createGate(gate: Omit<Gate, 'id' | 'createdAt'>): Promise<Gate>;
  listGates(filter: Partial<{ action: Gate['action']; allowed: boolean }>): Promise<Gate[]>;
  deleteGatesForAction(action: Gate['action']): Promise<void>;

  listWormBlocks(range?: Partial<{ fromIdx: number; toIdx: number }>): Promise<WormBlock[]>;
  appendWormBlock(payload: Record<string, unknown>): Promise<WormBlock>;
}

export class InMemoryRegDeskRepository implements RegDeskRepository {
  private rulepacks = new Map<string, Rulepack>();
  private regEvents = new Map<string, RegEvent>();
  private filings = new Map<string, Filing>();
  private deliveries = new Map<string, DeliveryLog>();
  private gates = new Map<string, Gate>();
  private wormBlocks: WormEntry[] = [];

  async upsertRulepack(input: Omit<Rulepack, 'id' | 'updatedAt'>): Promise<Rulepack> {
    const key = `${input.key}@${input.version}`;
    const existing = this.rulepacks.get(key);
    const record: Rulepack = {
      id: existing?.id ?? randomUUID(),
      updatedAt: existing?.updatedAt ?? new Date(),
      ...input
    } as Rulepack;
    this.rulepacks.set(key, record);
    return record;
  }

  async listRulepacks(): Promise<Rulepack[]> {
    return Array.from(this.rulepacks.values());
  }

  async getRulepackByKey(key: string): Promise<Rulepack | null> {
    const matches = Array.from(this.rulepacks.values()).filter((pack) => pack.key === key);
    if (!matches.length) {
      return null;
    }
    return matches.sort((a, b) => b.version - a.version)[0];
  }

  async findRulepacks(keys: string[]): Promise<Rulepack[]> {
    const keySet = new Set(keys);
    return Array.from(this.rulepacks.values()).filter((pack) => keySet.has(pack.key));
  }

  async findRegEventByKeyAndDue(key: string, due: Date): Promise<RegEvent | null> {
    return (
      Array.from(this.regEvents.values()).find(
        (event) => event.key === key && event.due.getTime() === due.getTime()
      ) ?? null
    );
  }

  async upsertRegEvent(event: Omit<RegEvent, 'id' | 'createdAt'> & { id?: string }): Promise<RegEvent> {
    const id = event.id ?? randomUUID();
    const record: RegEvent = {
      createdAt: event.id ? this.regEvents.get(id)?.createdAt ?? new Date() : new Date(),
      ...event,
      id
    } as RegEvent;
    this.regEvents.set(id, record);
    return record;
  }

  async listRegEvents(
    filter?: Partial<{ status: RegEvent['status']; track: RegEvent['track'] }>
  ): Promise<RegEvent[]> {
    let events = Array.from(this.regEvents.values());
    if (filter?.status) {
      events = events.filter((event) => event.status === filter.status);
    }
    if (filter?.track) {
      events = events.filter((event) => event.track === filter.track);
    }
    return events;
  }

  async updateRegEventStatus(
    id: string,
    status: RegEvent['status'],
    data?: Partial<Pick<RegEvent, 'opensAt' | 'closesAt' | 'blockers'>>
  ): Promise<RegEvent> {
    const current = this.regEvents.get(id);
    if (!current) {
      throw new Error(`RegEvent ${id} not found`);
    }
    const updated: RegEvent = {
      ...current,
      status,
      ...data
    } as RegEvent;
    this.regEvents.set(id, updated);
    return updated;
  }

  async createFiling(filing: Omit<Filing, 'id' | 'createdAt'>): Promise<Filing> {
    const record: Filing = {
      id: randomUUID(),
      createdAt: new Date(),
      ...filing
    } as Filing;
    this.filings.set(record.id, record);
    return record;
  }

  async updateFiling(id: string, data: Partial<Filing>): Promise<Filing> {
    const existing = this.filings.get(id);
    if (!existing) {
      throw new Error(`Filing ${id} not found`);
    }
    const updated = { ...existing, ...data } as Filing;
    this.filings.set(id, updated);
    return updated;
  }

  async listFilingsForEvent(eventId: string): Promise<Filing[]> {
    return Array.from(this.filings.values()).filter((filing) => filing.regEventId === eventId);
  }

  async createDeliveryLog(log: Omit<DeliveryLog, 'id' | 'createdAt'>): Promise<DeliveryLog> {
    const record: DeliveryLog = {
      id: randomUUID(),
      createdAt: new Date(),
      ...log
    } as DeliveryLog;
    this.deliveries.set(record.id, record);
    return record;
  }

  async listDeliveryLogs(
    filter: Partial<{ docKind: DeliveryLog['docKind']; clientId: string }>
  ): Promise<DeliveryLog[]> {
    return Array.from(this.deliveries.values()).filter((log) => {
      if (filter.docKind && log.docKind !== filter.docKind) {
        return false;
      }
      if (filter.clientId && log.clientId !== filter.clientId) {
        return false;
      }
      return true;
    });
  }

  async createGate(gate: Omit<Gate, 'id' | 'createdAt'>): Promise<Gate> {
    const record: Gate = { id: randomUUID(), createdAt: new Date(), ...gate } as Gate;
    this.gates.set(record.id, record);
    return record;
  }

  async listGates(filter: Partial<{ action: Gate['action']; allowed: boolean }>): Promise<Gate[]> {
    return Array.from(this.gates.values()).filter((gate) => {
      if (filter.action && gate.action !== filter.action) {
        return false;
      }
      if (typeof filter.allowed === 'boolean' && gate.allowed !== filter.allowed) {
        return false;
      }
      return true;
    });
  }

  async deleteGatesForAction(action: Gate['action']): Promise<void> {
    for (const [id, gate] of this.gates.entries()) {
      if (gate.action === action) {
        this.gates.delete(id);
      }
    }
  }

  async listWormBlocks(range?: Partial<{ fromIdx: number; toIdx: number }>): Promise<WormBlock[]> {
    let blocks = [...this.wormBlocks];
    if (typeof range?.fromIdx === 'number') {
      blocks = blocks.filter((block) => block.idx >= range.fromIdx!);
    }
    if (typeof range?.toIdx === 'number') {
      blocks = blocks.filter((block) => block.idx <= range.toIdx!);
    }
    return blocks.map((block) => ({ ...block } as WormBlock));
  }

  async appendWormBlock(payload: Record<string, unknown>): Promise<WormBlock> {
    const last = this.wormBlocks[this.wormBlocks.length - 1];
    const next = createBlock(payload, last);
    this.wormBlocks.push(next);
    return next as WormBlock;
  }
}

export const filingArtifactSchema = z.array(
  z.object({
    name: z.string(),
    path: z.string(),
    checksum: z.string()
  })
);

export function validateWormChain(blocks: WormBlock[]): void {
  if (!verifyChain(blocks)) {
    throw new Error('WORM chain verification failed');
  }
}
