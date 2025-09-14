import { Router } from 'express';
import fs from 'fs';
import crypto from 'crypto';
const r = Router(); const A='data/exp/assignments.jsonl', X='data/exp/exposures.jsonl', C='data/exp/conversions.jsonl', E='exp/experiments.json', S='exp/segments.json';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/exp',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const exps=()=> fs.existsSync(E)? JSON.parse(fs.readFileSync(E,'utf-8')).experiments||{}:{};
const segs=()=> fs.existsSync(S)? JSON.parse(fs.readFileSync(S,'utf-8')).segments||{}:{};

function inSegment(subject:any, seg:any){
  if(!seg?.criteria) return true;
  for(const c of seg.criteria){
    const v = (subject.attrs||{})[c.attr];
    if(c.op==='eq' && !(v===c.value)) return false;
    if(c.op==='neq' && !(v!==c.value)) return false;
    if(c.op==='in' && !Array.isArray(c.value)? true : !(Array.isArray(c.value) && c.value.includes(v))) return false;
    if(c.op==='contains' && !(String(v||'').includes(String(c.value)))) return false;
  }
  return true;
}
function assignVariant(exp:any, subject:any){
  const list=exp?.variants||[{name:'control',weight:1}];
  const seed = `${subject.id}:${exp.expId}:${process.env.EXP_HASH_SALT||'salt'}`;
  const h = crypto.createHash('sha256').update(seed).digest('hex');
  const frac = parseInt(h.slice(0,8), 16) / 0xffffffff;
  const weights = list.map((v:any)=>Number(v.weight||0)); const total = weights.reduce((s:number,w:number)=>s+w,0)||1;
  let cum=0; const target = frac * total;
  for(const v of list){ cum += Number(v.weight||0); if(target <= cum) return v.name; }
  return list[list.length-1].name;
}

r.post('/assign',(req,res)=>{
  const { expId, subject } = req.body||{};
  const exp = exps()[expId]; if(!exp) return res.status(404).json({error:'exp_not_found'});
  if(exp.state!=='running') return res.status(409).json({error:'exp_not_running'});
  const seg = exp.segment ? segs()[exp.segment] : null;
  const allowed = inSegment(subject||{}, seg);
  const variant = allowed ? assignVariant(exp, subject||{}) : 'control';
  const row={ ts:Date.now(), expId, subjectId: subject?.id, variant };
  append(A,row); res.json({ ok:true, variant });
});

r.post('/exposure',(req,res)=>{ append(X,{ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/convert',(req,res)=>{ append(C,{ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/events/recent',(req,res)=>{
  const id=String(req.query.expId||''); const exp=lines(X).filter((x:any)=>!id||x.expId===id).slice(-200);
  const conv=lines(C).filter((x:any)=>!id||x.expId===id || !x.expId).slice(-200);
  res.json({ exposures:exp, conversions:conv });
});

export default r;
