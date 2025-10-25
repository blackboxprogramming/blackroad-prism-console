import { FastifyInstance } from "fastify";
import { z } from "zod";

import { getEventBus, publishEvent, resetEventBus } from "../events/bus";

const DEFAULT_LIMIT = 200;

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.get("/events", async (req) => {
    const query = z
      .object({
        since: z.string().optional(),
        limit: z.coerce.number().int().positive().max(1000).optional(),
      })
      .parse(req.query ?? {});

    const bus = getEventBus();
    const history = bus.history();
    const since = query.since;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const startIndex = since ? history.findIndex((evt) => evt.id === since) : -1;
    let events = startIndex >= 0 ? history.slice(startIndex + 1) : history.slice();
    if (events.length > limit) {
      events = events.slice(events.length - limit);
    }

    const cursor = events.length > 0 ? events[events.length - 1].id : since ?? null;

    return {
      events,
      cursor,
      size: history.length,
    };
  });

  fastify.post("/events", async (req) => {
    const body = z
      .object({
        topic: z.string().min(1),
        payload: z.record(z.any()),
        actor: z.string().optional(),
        at: z.string().optional(),
        id: z.string().optional(),
        kpis: z.record(z.union([z.string(), z.number()])).optional(),
        memory_deltas: z.array(z.record(z.any())).optional(),
      })
      .parse(req.body ?? {});

    const event = await publishEvent(body.topic, body.payload, {
      actor: body.actor as any,
      at: body.at,
      id: body.id,
      kpis: body.kpis,
      memory_deltas: body.memory_deltas as any,
    });

    return { event };
  });
}

export function resetEventLogForTest() {
  resetEventBus();
}

export default eventRoutes;
