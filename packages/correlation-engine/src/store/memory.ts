import { EventEnvelope } from '../../../obs-mesh/src/envelope';
import { CorrelationKeyType } from '../index';

export class CorrelationStore {
  private readonly events: EventEnvelope[] = [];

  append(event: EventEnvelope): void {
    this.events.push(event);
  }

  findByKey(key: string, keyType: CorrelationKeyType): EventEnvelope[] {
    return this.events.filter((event) => {
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

  all(): EventEnvelope[] {
    return [...this.events];
  }
}

