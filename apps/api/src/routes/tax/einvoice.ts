import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DIR='data/tax/einvoices', EVI='data/tax/evidence.jsonl';
const write=(id:string,obj:any)=>{ fs.mkdirSync(DIR,{recursive:true}); fs.writeFileSync(`${DIR}/INV_${id}.json`, JSON.stringify(obj,null,2)); };
const appendEv=(row:any)=>{ fs.mkdirSync('data/tax',{recursive:true}); fs.appendFileSync(EVI, JSON.stringify(row)+'\n'); };

r.post('/einv/create',(req,res)=>{ const { invoiceId } = req.body||{}; write(invoiceId, { status:'created', ...req.body }); appendEv({ ts:Date.now(), invoiceId, event:'created' }); res.json({ ok:true }); });
r.post('/einv/transmit',(req,res)=>{ const { invoiceId, channel }=req.body||{}; const path=`${DIR}/INV_${invoiceId}.json`; if(!fs.existsSync(path)) return res.status(404).json({error:'not_found'}); const obj=JSON.parse(fs.readFileSync(path,'utf-8')); obj.status='transmitted'; obj.channel=channel||process.env.EINV_DEFAULT_CHANNEL||'peppol'; write(invoiceId,obj); appendEv({ ts:Date.now(), invoiceId, event:'transmitted', channel: obj.channel }); res.json({ ok:true }); });
r.get('/einv/status/:invoiceId',(req,res)=>{ const p=`${DIR}/INV_${String(req.params.invoiceId)}.json`; if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'}); res.json(JSON.parse(fs.readFileSync(p,'utf-8'))); });

export default r;
