
import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/crm/leads.jsonl', ACC='crm/accounts.json', CON='crm/contacts.json', OPP='crm/opps.json';
const append=(row:any)=>{ fs.mkdirSync('data/crm',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const readJson=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const writeJson=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/leads/create',(req,res)=>{ const row={ ts:Date.now(), converted:false, ...req.body, leadId: req.body?.leadId||uuid() }; append(row); res.json({ ok:true, leadId: row.leadId }); });

r.post('/leads/convert',(req,res)=>{
  const leadId=String(req.body?.leadId||''); const leads=read(); const ld=leads.find((l:any)=>l.leadId===leadId); if(!ld) return res.status(404).json({error:'not_found'});
  // create/update account
  const acc=readJson(ACC,{accounts:{}}); const accountId = req.body?.accountId || `A-${leadId}`;
  acc.accounts[accountId] = acc.accounts[accountId] || { id: accountId, name: ld.name || ld.company || 'New Account', owner: 'unassigned' };
  writeJson(ACC,acc);
  // create/update contact
  const con=readJson(CON,{contacts:{}}); const contactId = req.body?.contactId || `C-${leadId}`;
  con.contacts[contactId] = con.contacts[contactId] || { id: contactId, accountId, name: ld.name, email: ld.email };
  writeJson(CON,con);
  // optional opportunity
  if (req.body?.opportunity){
    const opp=readJson(OPP,{opps:{}}); const o=req.body.opportunity;
    opp.opps[o.id] = { ...o, accountId, stage: o.stage || process.env.CRM_DEFAULT_STAGE || 'Prospecting', probability: o.probability || 0.1 };
    writeJson(OPP,opp);
  }
  append({ ...ld, converted:true, convertedAt: Date.now(), accountId, contactId });
  res.json({ ok:true, accountId, contactId });
});

export default r;

