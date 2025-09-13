import LRU from 'lru-cache';
export const lru = new LRU<string, any>({ max: 500, ttl: 60_000 });
export function get(k:string){ return lru.get(k); }
export function set(k:string, v:any, ttlMs=60_000){ lru.set(k, v, { ttl: ttlMs }); }
