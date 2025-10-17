import crypto from 'node:crypto';
export function mkToken(payload: object, secret=process.env.OAUTH_SIGNING_SECRET||''){
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `${body}.${sig}`;
}
export function verify(tok:string, secret=process.env.OAUTH_SIGNING_SECRET||''){
  const [body,sig] = tok.split('.');
  if (!body || !sig) return null;
  const expect = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  try { return JSON.parse(Buffer.from(body,'base64url').toString('utf-8')); } catch { return null; }
}
