import fetch, { RequestInit, Response } from 'node-fetch';
import { PoolClient } from 'pg';

const MAX_ATTEMPTS = 6;
const BASE_DELAY_MS = 1000;
const MAX_ITEMS = Number(process.env.MAX_ITEMS_PER_RUN || 10_000);

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, attempt = 1): Promise<Response> {
  try {
    const response = await fetch(url, init);
    if (response.status === 401) {
      return response;
    }
    if ([429, 500, 502, 503, 504].includes(response.status) && attempt < MAX_ATTEMPTS) {
      const backoff = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 30_000);
      await delay(backoff);
      return fetchWithRetry(url, init, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS) {
      throw error;
    }
    const backoff = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 30_000);
    await delay(backoff);
    return fetchWithRetry(url, init, attempt + 1);
  }
}

export async function ingestSourceX(client: PoolClient, sourceId: string, token: string) {
  let next = process.env.SOURCE_X_EVENTS_URL || 'https://api.source-x.example.com/v1/events?limit=500';
  let count = 0;

  while (next) {
    if (count >= MAX_ITEMS) {
      break;
    }

    const response = await fetchWithRetry(next, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      throw new Error('Token invalid or revoked');
    }

    if (!response.ok) {
      throw new Error(`Upstream ${response.status}`);
    }

    const body = await response.json() as { data?: any[]; next?: string };

    const events = body.data ?? [];
    if (events.length) {
      const values: any[] = [];
      const rows = events.map((event, index) => {
        const offset = index * 5;
        values.push(
          event.id,
          sourceId,
          new Date(event.occurred_at).toISOString(),
          event.type ?? event.kind ?? 'unknown',
          JSON.stringify(event),
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}::jsonb)`;
      }).join(',');

      await client.query(
        `insert into raw_source_x_events (id, source_id, occurred_at, kind, payload)
         values ${rows}
         on conflict (id) do nothing`,
        values,
      );

      count += events.length;
    }

    if (!body.next || events.length === 0 || count >= MAX_ITEMS) {
      break;
    }

    next = body.next;
  }

  return count;
}
