import { Router } from 'express';
import fs from 'fs';
const r = Router(); const POL='iam/policies.json', LOG='data/iam/pdp.jsonl';
const pol=()=> fs.existsSync(POL)? JSON.parse(fs.readFileSync(POL,'utf-8')):{roles:[],rules:[]};
const append=(row:any)=>{ fs.mkdirSync('data/iam',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };

function evalRBAC(subject:any, action:string, resource:string){
  const p=pol(); const rolePerms=new Set<string>();
  (subject.groups||[]).forEach((g:string)=>{ const role=(p.roles||[]).find((r:any)=>r.name===g); (role?.permissions||[]).forEach((perm:string)=>rolePerms.add(perm)); });
  return rolePerms.has(`${action}:${resource}`) || rolePerms.has(`${action}:*`);
}
function evalABAC(subject:any, action:string, resource:string, context:any){
  for(const rule of (pol().rules||[])){
    if(rule.action!==action || (rule.resource!=='*' && rule.resource!==resource)) continue;
    const cond=rule.condition || {};
    const attr=cond.attr ? (((subject.attrs||{})[cond.attr]) ?? ((context||{})[cond.attr])) : undefined;
    const pass = cond.attr ? (attr===cond.equals) : true;
    if(pass) return rule.effect==='allow';
  }
  return false;
}

r.post('/pdp/evaluate',(req,res)=>{
  const { subject, action, resource, context } = req.body||{};
  const mode=String(process.env.IAM_PDP_MODE||'hybrid');
  const rbac = evalRBAC(subject||{}, action, resource);
  const abac = evalABAC(subject||{}, action, resource, context||{});
  const allow = mode==='rbac'? rbac : mode==='abac'? abac : (rbac || abac);
  const out={ ts:Date.now(), mode, subject, action, resource, allow };
  append(out); res.json({ ok:true, decision: allow?'allow':'deny', explain: out });
});
export default r;
