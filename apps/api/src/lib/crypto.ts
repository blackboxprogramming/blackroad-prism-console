import crypto from 'node:crypto';

export function hmac(value: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function signSession(payload: string, secret: string) {
  const sig = hmac(payload, secret);
  return `${payload}.${sig}`;
}

export function verifySession(signed: string, secret: string) {
  const [payload, sig] = signed.split('.');
  if (!payload || !sig) return null;
  const expect = hmac(payload, secret);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); }
  catch { return null; }
}
