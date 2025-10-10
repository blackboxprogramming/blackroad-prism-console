import { randomUUID } from "node:crypto";
import {
  InsiderIssuerRecord,
  InsiderPersonRecord,
  SurveillanceAlert,
  TradeRecord,
} from "../types.js";
import { WormLedger } from "@blackroad/worm";

export interface AddIssuerInput {
  symbol?: string;
  name: string;
  event: InsiderIssuerRecord["event"];
  windowStart: Date;
  windowEnd: Date;
  restrictedList?: boolean;
}

export interface AddPersonInput {
  personId: string;
  issuerId: string;
  wallCrossedAt: Date;
  notes?: string;
}

export interface InsiderTradeAssessment {
  allowed: boolean;
  alerts: SurveillanceAlert[];
  issuer?: InsiderIssuerRecord;
  reason?: string;
}

export class InsiderListService {
  private issuers = new Map<string, InsiderIssuerRecord>();

  private personsByIssuer = new Map<string, InsiderPersonRecord[]>();

  private persons = new Map<string, InsiderPersonRecord[]>();

  constructor(private readonly ledger?: WormLedger) {}

  addIssuer(input: AddIssuerInput): InsiderIssuerRecord {
    const issuer: InsiderIssuerRecord = {
      id: randomUUID(),
      symbol: input.symbol?.toUpperCase(),
      name: input.name,
      event: input.event,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      restrictedList: Boolean(input.restrictedList),
    };
    this.issuers.set(issuer.id, issuer);
    if (issuer.symbol) {
      this.issuers.set(issuer.symbol, issuer);
    }
    void this.ledger?.append({
      payload: { type: "INSIDER_ISSUER_CREATED", issuer },
    });
    return issuer;
  }

  addPerson(input: AddPersonInput): InsiderPersonRecord {
    const issuer = this.issuers.get(input.issuerId);
    if (!issuer) {
      throw new Error(`Unknown issuer ${input.issuerId}`);
    }
    const record: InsiderPersonRecord = {
      id: randomUUID(),
      personId: input.personId,
      issuerId: input.issuerId,
      wallCrossedAt: input.wallCrossedAt,
      notes: input.notes,
    };
    const issuerList = this.personsByIssuer.get(input.issuerId) ?? [];
    issuerList.push(record);
    this.personsByIssuer.set(input.issuerId, issuerList);
    const personList = this.persons.get(input.personId) ?? [];
    personList.push(record);
    this.persons.set(input.personId, personList);
    void this.ledger?.append({
      payload: { type: "INSIDER_PERSON_ADDED", record },
    });
    return record;
  }

  getRestrictedIssuers(): InsiderIssuerRecord[] {
    return [...new Set(this.issuers.values())].filter((issuer) => issuer.restrictedList);
  }

  assessTrade(trade: TradeRecord, actorId?: string): InsiderTradeAssessment {
    const issuer = this.findIssuerForTrade(trade);
    if (!issuer) {
      return { allowed: true, alerts: [] };
    }

    const withinWindow = trade.executedAt >= issuer.windowStart && trade.executedAt <= issuer.windowEnd;
    const isRestricted = issuer.restrictedList || withinWindow;
    const linkedPersons = actorId ? this.persons.get(actorId) ?? [] : [];
    const linkedToIssuer = linkedPersons.some((person) => person.issuerId === issuer.id);

    if (!isRestricted && !linkedToIssuer) {
      return { allowed: true, alerts: [] };
    }

    const shouldBlock = issuer.restrictedList || linkedToIssuer || withinWindow;
    if (!shouldBlock) {
      return { allowed: true, alerts: [] };
    }

    const alert: SurveillanceAlert = {
      id: randomUUID(),
      kind: "INSIDER",
      scenario: "INSIDER_WINDOW_BREACH",
      severity: 95,
      status: "Open",
      key: `${trade.accountId}|${trade.symbol}|${trade.executedAt.toISOString()}`,
      signal: {
        accountId: trade.accountId,
        symbol: trade.symbol,
        issuerId: issuer.id,
        issuerName: issuer.name,
        restrictedList: issuer.restrictedList,
        windowStart: issuer.windowStart.toISOString(),
        windowEnd: issuer.windowEnd.toISOString(),
        tradeExecutedAt: trade.executedAt.toISOString(),
        actorId: actorId ?? null,
      },
      createdAt: new Date(),
    };

    void this.ledger?.append({
      payload: {
        type: "INSIDER_ALERT_EMITTED",
        alert,
      },
    });

    return {
      allowed: false,
      alerts: [alert],
      issuer,
      reason: issuer.restrictedList ? "Issuer on restricted list" : "Trade inside restricted window",
    };
  }

  private findIssuerForTrade(trade: TradeRecord): InsiderIssuerRecord | undefined {
    if (trade.symbol) {
      const issuer = this.issuers.get(trade.symbol.toUpperCase());
      if (issuer) return issuer;
    }
    for (const issuer of this.issuers.values()) {
      if (issuer.symbol && issuer.symbol.toUpperCase() === trade.symbol.toUpperCase()) {
        return issuer;
      }
    }
    return undefined;
  }
}
