import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../lib/crypto.js';

const COOKIE = 'brsid';
export function sessionMiddleware(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
    if (cookie) {
      const val = decodeURIComponent(cookie.split('=')[1] || '');
      const data = verifySession(val, secret);
      if (data) (req as any).session = data;
    }
    next();
  };
}

export function setSessionCookie(res: Response, payload: object, secret: string, maxAgeSec: number) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signed = `${body}.${require('../lib/crypto.js').hmac(body, secret)}`;
  const cookie = [
    `brsid=${encodeURIComponent(signed)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', 'brsid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
}
