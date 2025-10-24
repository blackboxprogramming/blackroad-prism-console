import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { EventEnvelope } from '../../../obs-mesh/src/envelope';
import { CorrelationKeyType } from '../index';

export class FileStore {
  constructor(private readonly filePath: string) {}

  async append(event: EventEnvelope): Promise<void> {
    const events = await this.readAll();
    events.push(event);
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(events, null, 2));
  }

  async readAll(): Promise<EventEnvelope[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as EventEnvelope[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async findByKey(key: string, keyType: CorrelationKeyType): Promise<EventEnvelope[]> {
    const events = await this.readAll();
    return events.filter((event) => {
      switch (keyType) {
        case 'traceId':
          return event.traceId === key;
        case 'releaseId':
          return event.releaseId === key;
        case 'assetId':
          return event.assetId === key;
        case 'simId':
          return event.simId === key;
        default:
          return false;
      }
    });
  }
}

