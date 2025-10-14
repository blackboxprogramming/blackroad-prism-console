import fs from 'fs';
import path from 'path';

type Sample = { ts:number; key:string; route:string; status:number; bytes?:number };
export function meter() {
  return (req:any, res:any, next:any) => {
    const start = Date.now();
    const key = (req.apiKey && req.apiKey.key) || 'anon';
    const route = (req.baseUrl||'') + (req.route?.path||req.path||'');
    res.on('finish', () => {
      try {
        const month = new Date().toISOString().slice(0,7).replace('-','');
        const dir = path.join('data','metering');
        const file = path.join(dir, `usage-${month}.jsonl`);
        fs.mkdirSync(dir, { recursive:true });
        const row: Sample = { ts: start, key, route, status: res.statusCode };
        fs.appendFileSync(file, JSON.stringify(row)+'\n');
      } catch(_) {}
    });
    next();
  };
}
