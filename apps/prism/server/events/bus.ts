import {randomUUID} from 'crypto';

import {createEventBus, EventBus, PrismActor, PrismEvent, PrismMemoryDelta} from '../../packages/prism-core/src';

const bus: EventBus = createEventBus();

const fallbackId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function nextId(): string {
  try {
    return randomUUID();
  } catch {
    return fallbackId();
  }
}

export interface PublishOptions {
  actor?: PrismActor;
  at?: string;
  id?: string;
  kpis?: Record<string, string | number>;
  memory_deltas?: PrismMemoryDelta[];
}

export function getEventBus(): EventBus {
  return bus;
}

export function createEnvelope(
  topic: string,
  payload: Record<string, any>,
  options: PublishOptions = {}
): PrismEvent {
  const {actor = 'lucidia', at, id, kpis, memory_deltas} = options;
  const event: PrismEvent = {
    id: id ?? nextId(),
    at: at ?? new Date().toISOString(),
    actor,
    topic,
    payload: {...payload},
  };
  if (kpis) {
    event.kpis = {...kpis};
  }
  if (memory_deltas) {
    event.memory_deltas = memory_deltas.map((delta) => ({...delta}));
  }
  return event;
}

export async function publishEvent(
  topic: string,
  payload: Record<string, any>,
  options: PublishOptions = {}
): Promise<PrismEvent> {
  const event = createEnvelope(topic, payload, options);
  await bus.publish(event);
  return event;
}

export function resetEventBus(): void {
  bus.clear();
}
