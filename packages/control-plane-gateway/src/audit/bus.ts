import { EventEmitter } from 'eventemitter3';
import { ensureDir, appendFile } from 'fs-extra';
import { join } from 'path';
import { AuditEvent } from '../domain';

const AUDIT_TOPIC = 'audit';
const AUDIT_PATH = join(process.cwd(), 'var', 'audit', 'control-plane.log');

export class AuditBus {
  private readonly emitter = new EventEmitter();
  private readonly events: AuditEvent[] = [];

  async publish(event: AuditEvent) {
    this.emitter.emit(AUDIT_TOPIC, event);
    await ensureDir(join(process.cwd(), 'var', 'audit'));
    await appendFile(AUDIT_PATH, JSON.stringify(event) + '\n');
    this.events.push(event);
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  async *iterator(filter?: { serviceId?: string }): AsyncIterable<AuditEvent> {
    const queue: AuditEvent[] = [];
    const handler = (event: AuditEvent) => {
      if (!filter?.serviceId || event.metadata.serviceId === filter.serviceId) {
        queue.push(event);
      }
    };

    this.emitter.on(AUDIT_TOPIC, handler);
    try {
      while (true) {
        if (queue.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        yield queue.shift()!;
      }
    } finally {
      this.emitter.off(AUDIT_TOPIC, handler);
    }
  }

  tail(limit = 20, filter?: { serviceId?: string }): AuditEvent[] {
    return this.events
      .filter((event) => !filter?.serviceId || event.metadata.serviceId === filter.serviceId)
      .slice(-limit)
      .reverse();
  }
}
