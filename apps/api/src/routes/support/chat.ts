import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='data/support/chat_threads.jsonl';
function append(row:any){ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }

r.post('/chat/send', (req,res)=>{
  const { sessionId, message } = req.body||{};
  append({ sessionId, message, ts: Date.now() });
  res.json({ ok:true });
});

export default r;
