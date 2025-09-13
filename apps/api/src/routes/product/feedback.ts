import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/product/feedback.jsonl';
function append(row:any){ fs.mkdirSync('data/product',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }

r.post('/feedback',(req,res)=>{
  const { ideaId, epic, rating, comment, user } = req.body||{};
  append({ id: uuid(), ts: Date.now(), ideaId: ideaId||null, epic: epic||null, rating: Number(rating||0), comment: String(comment||''), user: String(user||'anon') });
  res.json({ ok:true });
});

export default r;
