import { Router } from 'express';
import fs from 'fs';
const r = Router(); const RULES='mdm/rules.json';
const pathFor=(d:string)=>({ stage:`data/mdm/stage_${d}.jsonl`, matches:`data/mdm/matches_${d}.jsonl` });
const readLines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const append=(p:string,row:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const rules=()=> fs.existsSync(RULES)? JSON.parse(fs.readFileSync(RULES,'utf-8')).rules||{}:{};

function scoreRecord(domain:string,a:any,b:any){
  const r = (rules()[domain]?.match?.keys||[]) as any[];
  if(!r.length){
    // sensible defaults
    if(domain==='contacts') return (a.record.email && a.record.email===b.record.email) ? 1 : 0;
    if(domain==='accounts'||domain==='vendors'){ const ad=(a.record.domain||a.record.name||'').toLowerCase(), bd=(b.record.domain||b.record.name||'').toLowerCase(); return ad && ad===bd ? 1 : 0; }
    if(domain==='items'){ return (a.record.sku && a.record.sku===b.record.sku) ? 1 : 0; }
    return 0;
  }
  let s=0, wsum=0;
  for(const k of r){ const va=(a.record[k.name]||'').toString().toLowerCase(), vb=(b.record[k.name]||'').toString().toLowerCase(); wsum+=Number(k.weight||1); if(va && vb && va===vb) s+=Number(k.weight||1); }
  return wsum? s/wsum : 0;
}

r.post('/match/run',(req,res)=>{
  const domain=String(req.body?.domain||'accounts'); const p=pathFor(domain); const rows=readLines(p.stage); const th=Number((rules()[domain]?.match?.threshold) ?? process.env.MDM_DEFAULT_THRESHOLD ?? 0.85);
  const clusters:any[]=[]; let cid=1;
  for(let i=0;i<rows.length;i++){
    let placed=false;
    for(const c of clusters){
      // compare against first member
      const s=scoreRecord(domain, rows[i], c.members[0]); if(s>=th){ c.members.push(rows[i]); placed=true; break; }
    }
    if(!placed){ clusters.push({ clusterId:`${domain}-${cid++}`, members:[rows[i]] }); }
  }
  append(p.matches, { ts:Date.now(), domain, clusters });
  res.json({ ok:true, domain, clusters_count: clusters.length });
});
export default r;
