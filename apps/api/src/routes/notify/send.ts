import { Router } from 'express';
import fetch from 'node-fetch';
import webpush from 'web-push';
const r = Router();

async function sendEmail(url:string,to:string,subject:string,text:string){
  // SMTP URL style: smtp://user:pass@host:port — use a relay service that accepts HTTP webhook if needed
  return fetch(url,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to, subject, text }) });
}
async function sendSMS(sid:string, token:string, from:string, to:string, message:string){
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{
    method:'POST',
    headers:{ 'Authorization':`Basic ${auth}`, 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: from, To: to, Body: message }).toString()
  });
}

r.post('/send', async (req, res) => {
  const { channel, to, subject, message } = req.body || {};
  try{
    if (channel === 'email') {
      await sendEmail(process.env.SMTP_URL||'', String(to), String(subject||'BlackRoad'), String(message||''));
    } else if (channel === 'sms') {
      await sendSMS(process.env.TWILIO_SID||'', process.env.TWILIO_TOKEN||'', process.env.TWILIO_FROM||'', String(to), String(message||''));
    } else {
      res.status(400).json({ error:'unsupported_channel' }); return;
    }
    res.json({ ok:true });
  }catch(e:any){ res.status(500).json({ error:e?.message||'failed' }); }
});
export default r;
