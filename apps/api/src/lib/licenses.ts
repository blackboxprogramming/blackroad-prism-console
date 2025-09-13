import crypto from 'node:crypto';
type Payload = { owner:string; plan:string; exp:number };

function signPayload(p:Payload, secret:string){
  const body = Buffer.from(JSON.stringify(p)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `${body}.${sig}`;
}
function verifyToken(tok:string, secret:string): Payload|null {
  const [body, sig] = tok.split('.');
  if (!body || !sig) return null;
  const expect = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')); } catch { return null; }
}

export function issueLicense(owner:string, plan:string, days=365, secret=process.env.LICENSE_SIGNING_SECRET||''){
  const exp = Date.now() + days*86400000;
  return signPayload({ owner, plan, exp }, secret);
}
export function verifyLicense(tok:string, secret=process.env.LICENSE_SIGNING_SECRET||''){
  const p = verifyToken(tok, secret);
  if (!p) return { ok:false, reason:'bad_signature' };
  if (Date.now() > p.exp) return { ok:false, reason:'expired' };
  return { ok:true, owner:p.owner, plan:p.plan, exp:p.exp };
}
