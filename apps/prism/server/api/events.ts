import { FastifyInstance } from "fastify";
import { z } from "zod";
import { events as runbookEvents } from "./runbooks";

type KnownEventType = "plan" | "file.write" | string;

export interface PrismEvent<T = any> {
  id: number;
  type: KnownEventType;
  timestamp: string;
  payload: T;
}

const MAX_EVENTS = 200;
const eventLog: PrismEvent[] = [];
let nextEventId = 1;
let listenersAttached = false;

function serializePayload(payload: unknown): unknown {
  if (payload === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return payload;
  }
}

function recordEvent(type: KnownEventType, payload: unknown): PrismEvent {
  const event: PrismEvent = {
    id: nextEventId++,
    type,
    timestamp: new Date().toISOString(),
    payload: serializePayload(payload),
  };
  eventLog.push(event);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.splice(0, eventLog.length - MAX_EVENTS);
  }
  return event;
}

function getEventsAfter(id: number): PrismEvent[] {
  return eventLog.filter((evt) => evt.id > id);
}

function ensureListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  runbookEvents.on("plan", (payload) => {
    recordEvent("plan", payload);
  });
  runbookEvents.on("file.write", (payload) => {
    recordEvent("file.write", payload);
  });
}

export async function eventRoutes(fastify: FastifyInstance) {
  ensureListeners();

  fastify.get("/events", async (req) => {
    const query = z
      .object({
        since: z.coerce.number().int().nonnegative().optional(),
      })
      .parse(req.query ?? {});

    const since = query.since ?? 0;
    const events = getEventsAfter(since);
    const cursor = events.length > 0 ? events[events.length - 1].id : since;
    return { events, cursor };
  });
}

export function resetEventLogForTest() {
  eventLog.length = 0;
  nextEventId = 1;
}

export default eventRoutes;
