import Redis from 'ioredis';
let client: Redis | null = null;
export function redis(){
  if (!process.env.REDIS_URL) return null;
  if (!client) client = new Redis(process.env.REDIS_URL);
  return client;
}
export async function rget(k:string){ const c=redis(); return c? await c.get(k):null; }
export async function rset(k:string, v:string, ttlSec=60){ const c=redis(); if(c) await c.set(k,v,'EX',ttlSec); }
