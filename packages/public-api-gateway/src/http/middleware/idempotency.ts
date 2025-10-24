import { NextFunction, Request, Response } from 'express';

interface CacheEntry {
  status: number;
  body: unknown;
  storedAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 24 * 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [key, value] of CACHE) {
    if (now - value.storedAt > TTL_MS) {
      CACHE.delete(key);
    }
  }
}

export function idempotencyMiddleware() {
  return function idempotencyHandler(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'POST') {
      return next();
    }

    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      return next();
    }

    cleanup();

    const cached = CACHE.get(idempotencyKey);
    if (cached) {
      res.setHeader('Idempotency-Key', idempotencyKey);
      res.status(cached.status).json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = function patchedJson(body: unknown) {
      CACHE.set(idempotencyKey, { status: res.statusCode, body, storedAt: Date.now() });
      res.setHeader('Idempotency-Key', idempotencyKey);
      return originalJson(body);
    };

    next();
  };
}

export function getIdempotencyCacheSize() {
  return CACHE.size;
}
