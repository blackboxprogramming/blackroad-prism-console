import fs from 'fs';
import { v4 as uuid } from 'uuid';

type Key = { id:string; key:string; owner:string; created:number; revoked?:number; quota?:{ max:number; windowSec:number } };
const PATH = 'apps/api/keys.json';

function load(): Key[] { return fs.existsSync(PATH) ? JSON.parse(fs.readFileSync(PATH,'utf-8')) : []; }
function save(v: Key[]) { fs.mkdirSync('apps/api', { recursive:true }); fs.writeFileSync(PATH, JSON.stringify(v,null,2)); }

export function issue(owner:string, quota={ max:Number(process.env.RATE_LIMIT_MAX||600), windowSec:Number(process.env.RATE_LIMIT_WINDOW_SEC||60) }): Key {
  const all = load();
  const k: Key = { id: uuid(), key: uuid().replace(/-/g,''), owner, created: Date.now(), quota };
  all.push(k); save(all); return k;
}
export function revoke(idOrKey:string) {
  const all = load(); const k = all.find(x => x.id===idOrKey || x.key===idOrKey); if (k) { k.revoked = Date.now(); save(all); }
  return k;
}
export function getActive(key:string): Key|undefined {
  const k = load().find(x => x.key===key && !x.revoked); return k;
}
export function list(): Key[] { return load(); }
