import { v4 as uuid } from "uuid";
import { ExceptionDetail, ExceptionQueue, ExceptionRecord } from "./types.js";

export class InMemoryExceptionQueue implements ExceptionQueue {
  private readonly store = new Map<string, ExceptionRecord>();

  enqueue(detail: ExceptionDetail): ExceptionRecord {
    const record: ExceptionRecord = {
      ...detail,
      id: uuid(),
      createdAt: new Date(),
      resolvedAt: null,
      status: "Open",
    };
    this.store.set(record.id, record);
    return record;
  }

  resolve(id: string, status: ExceptionRecord["status"], _note?: string): ExceptionRecord {
    const record = this.store.get(id);
    if (!record) {
      throw new Error(`Exception ${id} not found`);
    }
    const updated: ExceptionRecord = {
      ...record,
      status,
      resolvedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  listOpen(): ExceptionRecord[] {
    return Array.from(this.store.values()).filter((record) => record.status === "Open");
  }
}

