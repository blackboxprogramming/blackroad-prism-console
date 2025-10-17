import { Router } from 'express';
import fs from 'fs';
const r = Router(); const Q='lms/quizzes.json', SUB='data/lms/quiz_submissions.jsonl', RES='data/lms/quiz_results.jsonl';
const read=()=> fs.existsSync(Q)? JSON.parse(fs.readFileSync(Q,'utf-8')):{ quizzes:{} };
const write=(o:any)=>{ fs.mkdirSync('lms',{recursive:true}); fs.writeFileSync(Q, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/lms',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/quizzes/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.quizzes[v.id]=v; write(o); res.json({ ok:true }); });

r.post('/quizzes/submit',(req,res)=>{
  const { quizId, subjectId, answers } = req.body||{};
  append(SUB,{ ts:Date.now(), quizId, subjectId, answers });
  const quiz=read().quizzes[quizId]||{questions:[],pass_pct:100};
  // naive scoring: proportion of exact matches on 'answer'
  let correct=0, total=0;
  for(const q of (quiz.questions||[])){ total++; const a=answers?.[q.qid]; if(JSON.stringify(a)===JSON.stringify(q.answer)) correct++; }
  const pct = total? (correct/total)*100 : 0; const pass = pct >= Number(quiz.pass_pct||100);
  append(RES,{ ts:Date.now(), quizId, subjectId, score_pct: Number(pct.toFixed(2)), pass });
  res.json({ ok:true, score_pct: Number(pct.toFixed(2)), pass });
});

r.get('/quizzes/results',(req,res)=>{
  const { quizId, subjectId } = req.query as any;
  const items = fs.existsSync(RES)? fs.readFileSync(RES,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=> (!quizId||x.quizId===quizId) && (!subjectId||x.subjectId===subjectId) ).slice(-10):[];
  res.json({ items });
});

export default r;
