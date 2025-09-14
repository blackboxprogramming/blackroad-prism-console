import { Router } from 'express';
import fs from 'fs';
const r = Router(); const BOT='support/bot.json', MAC='support/macros.json', LOG='data/support/bot_logs.jsonl', MSG='data/support/messages.jsonl';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };
const appendMsg=(row:any)=>{ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(MSG, JSON.stringify(row)+'\n'); };
r.post('/bot/intents/set',(req,res)=>{ write(BOT,{ intents: req.body?.intents||[] }); res.json({ ok:true }); });
r.post('/macros/set',(req,res)=>{ write(MAC,{ macros: req.body?.macros||[] }); res.json({ ok:true }); });
r.post('/bot/reply',(req,res)=>{
  const intents=(read(BOT,{intents:[]}).intents||[]); const txt=String(req.body?.text||'').toLowerCase(); const match=intents.find((i:any)=> (i.utterances||[]).some((u:string)=> txt.includes(u.toLowerCase())) );
  const reply= match ? (match.reply_md||'') : 'Thanks! An agent will follow up.';
  append({ ts:Date.now(), ticketId:req.body?.ticketId, text:req.body?.text, reply });
  if(req.body?.ticketId){ appendMsg({ ts:Date.now(), ticketId:req.body?.ticketId, author:{id:'bot',email:'bot@blackroad.io',role:'bot'}, text: reply }); }
  res.json({ ok:true, reply });
});
export default r;
