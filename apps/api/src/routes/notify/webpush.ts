import { Router } from 'express';
import webpush from 'web-push';
const r = Router();
webpush.setVapidDetails(process.env.WEBPUSH_CONTACT||'mailto:support@blackroad.io', process.env.WEBPUSH_PUBLIC_KEY||'', process.env.WEBPUSH_PRIVATE_KEY||'');

const subs: any[] = [];
r.post('/subscribe', (req,res)=>{ subs.push(req.body); res.json({ ok:true }); });
r.post('/broadcast', async (req,res)=>{
  const payload = JSON.stringify({ title: 'BlackRoad', body: String(req.body?.message||'') });
  await Promise.all(subs.map(s=>webpush.sendNotification(s, payload).catch(()=>null)));
  res.json({ ok:true, delivered: subs.length });
});
export default r;
