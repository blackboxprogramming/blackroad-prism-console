import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface AuthContext {
  actor?: {
    type: 'oauth' | 'service' | 'pat';
    id: string;
    scopes: string[];
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
    rawBody?: string;
  }
}

const REQUIRED_SCOPE_HEADER = 'x-blackroad-scope';

export function oauthMiddleware() {
  return function oauthHandler(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }

    try {
      const token = header.slice('Bearer '.length);
      const payload = jwt.decode(token, { json: true }) as jwt.JwtPayload | null;
      if (!payload) {
        return next();
      }

      const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
      req.auth = {
        actor: {
          type: 'oauth',
          id: String(payload.sub ?? 'unknown'),
          scopes,
        },
      };
    } catch (err) {
      console.warn('oauth token decode failed', err);
    }

    next();
  };
}

export function serviceTokenMiddleware() {
  return function serviceTokenHandler(req: Request, _res: Response, next: NextFunction) {
    if (req.auth?.actor) {
      return next();
    }
    const header = req.headers['x-blackroad-token'];
    if (!header || Array.isArray(header)) {
      return next();
    }

    const [serviceId, signature] = header.split('.');
    if (!serviceId || !signature) {
      return next();
    }

    req.auth = {
      actor: {
        type: 'service',
        id: serviceId,
        scopes: (req.headers[REQUIRED_SCOPE_HEADER] as string | undefined)?.split(' ') ?? [],
      },
    };

    console.info('service token accepted', serviceId);
    next();
  };
}

export interface SignatureOptions {
  clockToleranceSeconds?: number;
}

export function signatureMiddleware(options: SignatureOptions = {}) {
  const tolerance = options.clockToleranceSeconds ?? 300;
  return function signatureHandler(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-blackroad-signature'];
    const timestampHeader = req.headers['x-blackroad-timestamp'];
    if (!signature || Array.isArray(signature) || !timestampHeader || Array.isArray(timestampHeader)) {
      return next();
    }

    const timestamp = Number.parseInt(timestampHeader, 10);
    if (Number.isNaN(timestamp)) {
      res.status(400).json({ error: { code: 'invalid_signature', message: 'timestamp invalid' } });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      res.status(400).json({ error: { code: 'invalid_signature', message: 'timestamp outside tolerance' } });
      return;
    }

    const payload = req.rawBody ?? JSON.stringify(req.body ?? {});
    const expected = crypto
      .createHmac('sha256', process.env.BLACKROAD_SHARED_SECRET ?? 'development-secret')
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const provided = Buffer.from(String(signature), 'hex');
    const computed = Buffer.from(expected, 'hex');

    if (provided.length !== computed.length || !crypto.timingSafeEqual(provided, computed)) {
      res.status(401).json({ error: { code: 'invalid_signature', message: 'signature mismatch' } });
      return;
    }

    next();
  };
}

export function hasScope(req: Request, scope: string): boolean {
  return Boolean(req.auth?.actor?.scopes?.includes(scope));
}
