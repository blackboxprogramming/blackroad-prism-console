import {PrismEvent} from 'prism-core';

type EventListener = (events: PrismEvent[]) => void | Promise<void>;

type Fetcher = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

const listeners = new Set<EventListener>();
let cursor: string | null = null;
let inflight: Promise<PrismEvent[]> | null = null;

const resolveFetcher = (override?: Fetcher): Fetcher => override ?? fetch;

async function fetchEvents(fetcher?: Fetcher): Promise<PrismEvent[]> {
  const client = resolveFetcher(fetcher);
  const query = cursor ? `?since=${encodeURIComponent(cursor)}` : '';
  const response = await client(`/api/events${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }
  const data = await response.json();
  cursor = data.cursor ?? cursor;
  const events: PrismEvent[] = Array.isArray(data.events) ? data.events : [];
  if (events.length > 0) {
    for (const listener of listeners) {
      void listener(events);
    }
  }
  return events;
}

export const prismStore = {
  subscribe(listener: EventListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getCursor(): string | null {
    return cursor;
  },
  reset(): void {
    cursor = null;
  },
  async refresh(fetcher?: Fetcher): Promise<PrismEvent[]> {
    if (!inflight) {
      inflight = fetchEvents(fetcher).finally(() => {
        inflight = null;
      });
    }
    return inflight;
  },
};
