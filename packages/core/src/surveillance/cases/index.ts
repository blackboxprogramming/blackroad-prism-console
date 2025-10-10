import { randomUUID } from "node:crypto";
import {
  CaseItemRecord,
  CaseItemType,
  CaseRecord,
  CaseStatus,
  SurveillanceAlert,
} from "../types.js";
import { WormLedger } from "@blackroad/worm";

export interface CreateCaseInput {
  title: string;
  summary?: string;
  ownerId?: string;
  alerts?: SurveillanceAlert[];
}

export interface CloseCaseInput {
  caseId: string;
  status: CaseStatus;
  summary?: string;
  disposition: "No Issue" | "Training" | "Discipline" | "SAR Filed" | "Remediation";
  closedBy: string;
}

export interface CaseNoteInput {
  authorId: string;
  body: string;
}

export interface CaseTaskInput {
  description: string;
  dueAt?: Date;
  assigneeId?: string;
}

export class CaseService {
  private cases = new Map<string, CaseRecord>();

  private items = new Map<string, CaseItemRecord[]>();

  private alertKeyIndex = new Map<string, string>();

  private scenarioIndex = new Map<string, string>();

  constructor(private readonly ledger: WormLedger) {}

  ingestAlert(alert: SurveillanceAlert): CaseRecord {
    const existingCaseId = this.alertKeyIndex.get(this.alertIndexKey(alert));
    if (existingCaseId) {
      const caseRecord = this.getCase(existingCaseId);
      this.linkAlert(caseRecord.id, alert);
      return caseRecord;
    }
    const scenarioCaseId = this.scenarioIndex.get(alert.scenario);
    if (scenarioCaseId) {
      const caseRecord = this.getCase(scenarioCaseId);
      this.linkAlert(caseRecord.id, alert);
      return caseRecord;
    }
    if (alert.severity >= 80) {
      const existing = this.findCaseByAlert(alert.id);
      if (existing) {
        return existing;
      }
      return this.createCase({
        title: `${alert.scenario} investigation`,
        summary: `Auto-created for alert ${alert.id}`,
        alerts: [alert],
      });
    }

    const triage = this.getOrCreateTriageCase();
    this.linkAlert(triage.id, alert);
    return triage;
  }

  createCase(input: CreateCaseInput): CaseRecord {
    const id = randomUUID();
    const caseRecord: CaseRecord = {
      id,
      title: input.title,
      status: "Open",
      ownerId: input.ownerId,
      summary: input.summary,
      alerts: input.alerts ?? [],
      createdAt: new Date(),
    };
    this.cases.set(id, caseRecord);
    this.items.set(id, []);
    void this.ledger.append({ payload: { type: "CASE_CREATED", case: caseRecord } });
    if (input.alerts) {
      for (const alert of input.alerts) {
        this.linkAlert(id, alert);
      }
      if (input.alerts.some((alert) => alert.severity >= 80)) {
        this.scenarioIndex.set(input.alerts[0]?.scenario ?? id, id);
      }
    }
    return caseRecord;
  }

  addNote(caseId: string, note: CaseNoteInput): CaseItemRecord {
    const record = this.getCase(caseId);
    const item: CaseItemRecord = {
      id: randomUUID(),
      caseId,
      type: "Note",
      refId: note.authorId,
      meta: { body: note.body, createdAt: new Date().toISOString() },
    };
    this.appendItem(caseId, item);
    record.summary = record.summary ?? "";
    void this.ledger.append({ payload: { type: "CASE_NOTE_ADDED", caseId, item } });
    return item;
  }

  attachDocument(caseId: string, docId: string, meta: Record<string, unknown> = {}): CaseItemRecord {
    this.ensureCase(caseId);
    const item: CaseItemRecord = {
      id: randomUUID(),
      caseId,
      type: "Document",
      refId: docId,
      meta,
    };
    this.appendItem(caseId, item);
    void this.ledger.append({ payload: { type: "CASE_DOCUMENT_ATTACHED", caseId, item } });
    return item;
  }

  createTask(caseId: string, task: CaseTaskInput): CaseItemRecord {
    this.ensureCase(caseId);
    const item: CaseItemRecord = {
      id: randomUUID(),
      caseId,
      type: "Task",
      refId: randomUUID(),
      meta: { ...task, createdAt: new Date().toISOString() },
    };
    this.appendItem(caseId, item);
    void this.ledger.append({ payload: { type: "CASE_TASK_CREATED", caseId, item } });
    return item;
  }

  closeCase(input: CloseCaseInput): CaseRecord {
    const record = this.getCase(input.caseId);
    if (!record) {
      throw new Error(`Unknown case ${input.caseId}`);
    }
    record.status = input.status;
    record.closedAt = new Date();
    record.summary = input.summary ?? record.summary;
    void this.ledger.append({
      payload: {
        type: "CASE_CLOSED",
        caseId: record.id,
        status: record.status,
        disposition: input.disposition,
        closedBy: input.closedBy,
        closedAt: record.closedAt?.toISOString(),
      },
    });
    return record;
  }

  getCase(caseId: string): CaseRecord {
    const record = this.cases.get(caseId);
    if (!record) {
      throw new Error(`Unknown case ${caseId}`);
    }
    return record;
  }

  listCases(): CaseRecord[] {
    return [...this.cases.values()];
  }

  getItems(caseId: string): CaseItemRecord[] {
    return [...(this.items.get(caseId) ?? [])];
  }

  private appendItem(caseId: string, item: CaseItemRecord): void {
    const items = this.items.get(caseId) ?? [];
    items.push(item);
    this.items.set(caseId, items);
  }

  private ensureCase(caseId: string): void {
    if (!this.cases.has(caseId)) {
      throw new Error(`Unknown case ${caseId}`);
    }
  }

  private getOrCreateTriageCase(): CaseRecord {
    let triage = [...this.cases.values()].find((c) => c.title === "Triage Queue" && c.status === "Open");
    if (!triage) {
      triage = this.createCase({ title: "Triage Queue", summary: "Pending alerts" });
    }
    return triage;
  }

  private linkAlert(caseId: string, alert: SurveillanceAlert): void {
    const caseRecord = this.getCase(caseId);
    caseRecord.alerts = caseRecord.alerts ?? [];
    if (!caseRecord.alerts.find((existing) => existing.id === alert.id)) {
      caseRecord.alerts.push(alert);
      const item: CaseItemRecord = {
        id: randomUUID(),
        caseId,
        type: "Alert",
        refId: alert.id,
        meta: alert.signal,
      };
      this.appendItem(caseId, item);
      void this.ledger.append({ payload: { type: "CASE_ALERT_LINKED", caseId, alertId: alert.id } });
      this.alertKeyIndex.set(this.alertIndexKey(alert), caseId);
    }
  }

  private findCaseByAlert(alertId: string): CaseRecord | undefined {
    return [...this.cases.values()].find((c) => c.alerts?.some((alert) => alert.id === alertId));
  }

  private alertIndexKey(alert: SurveillanceAlert): string {
    return `${alert.scenario}|${alert.key}`;
  }
}
