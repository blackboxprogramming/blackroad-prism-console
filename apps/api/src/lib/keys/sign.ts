import crypto from 'node:crypto';
export function sign(body:string, secret:string){ return crypto.createHmac('sha256', secret).update(body).digest('hex'); }
export function verify(body:string, sig:string, secret:string){ return sign(body, secret) === sig; }
