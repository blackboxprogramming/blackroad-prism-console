import fs from 'fs';
export function auditAppend(orgId:string, action:string, meta:any){
  const dir = 'data/audit';
  fs.mkdirSync(dir, { recursive:true });
  fs.appendFileSync(`${dir}/${orgId}.jsonl`, JSON.stringify({ ts: Date.now(), action, meta })+'\n');
}
