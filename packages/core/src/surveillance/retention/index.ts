import { CommRecord } from "../types.js";
import { WormLedger } from "@blackroad/worm";

export interface RetentionPolicy {
  retentionKey: string;
  days: number;
}

export interface ArchivedComm extends CommRecord {
  archivedAt: Date;
  retentionKey: string;
  expiresAt: Date;
  archived: boolean;
  deletedAt?: Date;
}

export class RetentionService {
  private policies = new Map<string, RetentionPolicy>();

  private comms = new Map<string, ArchivedComm>();

  constructor(private readonly ledger: WormLedger) {}

  setPolicy(policy: RetentionPolicy): void {
    this.policies.set(policy.retentionKey, policy);
  }

  archive(comm: CommRecord, retentionKey: string): ArchivedComm {
    const policy = this.policies.get(retentionKey);
    if (!policy) {
      throw new Error(`No retention policy for ${retentionKey}`);
    }
    const archivedAt = new Date();
    const expiresAt = new Date(archivedAt.getTime() + policy.days * 24 * 60 * 60 * 1000);
    const record: ArchivedComm = { ...comm, archivedAt, expiresAt, retentionKey, archived: true };
    this.comms.set(comm.id, record);
    void this.ledger.append({ payload: { type: "COMM_ARCHIVED", commId: comm.id, retentionKey, expiresAt: expiresAt.toISOString() } });
    return record;
  }

  listArchived(): ArchivedComm[] {
    return [...this.comms.values()];
  }

  markExpired(now: Date = new Date()): ArchivedComm[] {
    const expired: ArchivedComm[] = [];
    for (const comm of this.comms.values()) {
      if (!comm.deletedAt && comm.expiresAt <= now) {
        comm.archived = false;
        comm.deletedAt = now;
        expired.push(comm);
        void this.ledger.append({ payload: { type: "COMM_EXPIRED", commId: comm.id, expiredAt: now.toISOString() } });
      }
    }
    return expired;
  }

  purgeExpired(): ArchivedComm[] {
    const purged: ArchivedComm[] = [];
    for (const [id, comm] of [...this.comms.entries()]) {
      if (comm.deletedAt) {
        this.comms.delete(id);
        purged.push(comm);
        void this.ledger.append({ payload: { type: "COMM_PURGED", commId: comm.id, purgedAt: new Date().toISOString() } });
      }
    }
    return purged;
  }
}
