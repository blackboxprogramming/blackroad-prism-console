import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const XREF='mdm/xref.json', RULES='mdm/rules.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };
const pathFor=(d:string)=>({ matches:`data/mdm/matches_${d}.jsonl`, golden:`mdm/golden/${d}.json` });
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
function survivorship(domain:string, members:any[]){
  const rule=read(RULES,{rules:{}}).rules?.[domain]?.survivorship || { precedence:['*'], tie_break:'recent' };
  // choose preferred source by precedence
  function pickField(f:string){
    for(const src of rule.precedence){
      const candidates = members.filter((m:any)=> src==='*' || m.source===src).filter((m:any)=> m.record[f]!=null);
      if(candidates.length){
        return rule.tie_break==='recent' ? candidates.sort((a:any,b:any)=>b.ts-a.ts)[0].record[f] : candidates[0].record[f];
      }
    }
    return null;
  }
  const allKeys = new Set<string>(members.flatMap((m:any)=>Object.keys(m.record||{})));
  const golden:any={}; for(const k of allKeys){ const v=pickField(k); if(v!=null) golden[k]=v; }
  return golden;
}
r.post('/merge/apply',(req,res)=>{
  const domain=String(req.body?.domain||'accounts'); const p=pathFor(domain); const ms=lines(p.matches).slice(-1)[0]?.clusters||[];
  const cluster = ms.find((c:any)=>c.clusterId===req.body?.clusterId) || ms[0] || { clusterId:`${domain}-auto`, members:[] };
  const goldenId = req.body?.goldenId || `${(process.env.MDM_ID_NAMESPACE||'blackroad')}-${domain}-${uuid().slice(0,8)}`;
  const goldenRec = survivorship(domain, cluster.members||[]);
  const g = read(p.golden,{ records:{} }); g.records[goldenId]=goldenRec; write(p.golden,g);
  const x = read(XREF,{ xref:{} }); for(const m of (cluster.members||[])){ const key=`${domain}:${m.source}:${m.source_id}`; x.xref[key]=goldenId; } write(XREF,x);
  res.json({ ok:true, goldenId, size:(cluster.members||[]).length });
});
r.get('/golden/:domain',(req,res)=>{ const p=pathFor(String(req.params.domain)).golden; const g=read(p,{records:{}}); res.json(g); });
export default r;
