import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'br_admin_session';

type SessionPayload = Record<string, unknown> & {
  uid: string;
  email?: string;
  exp?: number;
};

function parseCookieHeader(header: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    if (!rawKey) continue;
    const key = rawKey.trim();
    if (!key) continue;
    const value = rest.join('=').trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function cookieParser() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!(req as any).cookies) {
      (req as any).cookies = parseCookieHeader(req.headers.cookie);
    }
    next();
  };
}

export function setSessionCookie(res: Response, payload: SessionPayload, secret: string, maxAgeSeconds: number) {
  if (!secret) {
    throw new Error('SESSION_SECRET is required to issue admin sessions');
  }
  const now = Math.floor(Date.now() / 1000);
  const data = { ...payload, exp: now + maxAgeSeconds };
  const body = Buffer.from(JSON.stringify(data), 'utf-8').toString('base64url');
  const signature = sign(body, secret);
  res.cookie(SESSION_COOKIE, `${body}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds * 1000
  });
}

function constantTimeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a, 'utf-8');
  const bBuf = Buffer.from(b, 'utf-8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function requireSession() {
  return (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.SESSION_SECRET || '';
    if (!secret) {
      return res.status(500).json({ error: 'session_not_configured' });
    }
    const cookies = (req as any).cookies || parseCookieHeader(req.headers.cookie);
    const raw = cookies[SESSION_COOKIE];
    if (!raw) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const [body, signature] = raw.split('.');
    if (!body || !signature) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const expected = sign(body, secret);
    if (!constantTimeEquals(expected, signature)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    let session: SessionPayload;
    try {
      session = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    } catch {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'session_expired' });
    }
    (req as any).session = session;
    next();
  };
}

export { SESSION_COOKIE };
