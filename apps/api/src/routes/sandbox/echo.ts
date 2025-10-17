import { Router } from 'express';
const r = Router();
let last: any = null;

r.post('/webhook_echo', (req,res)=>{ last = { ts: Date.now(), headers: req.headers, body: req.body }; res.json({ ok:true }); });
r.get('/webhook_echo/last', (_req,res)=> res.json(last || { ts:null }));

export default r;
