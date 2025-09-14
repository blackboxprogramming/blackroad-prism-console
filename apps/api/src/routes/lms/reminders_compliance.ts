import { Router } from 'express';
import fs from 'fs';
const r = Router(); const EN='data/lms/enrollments.jsonl', PR='data/lms/progress.jsonl', REM='data/lms/reminders.jsonl', CMP='data/lms/compliance.jsonl', POL='lms/policies.json';
const en=()=> fs.existsSync(EN)? fs.readFileSync(EN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const prog=()=> fs.existsSync(PR)? fs.readFileSync(PR,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const append=(p:string,row:any)=>{ fs.mkdirSync('data/lms',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/reminders/run',(req,res)=>{
  const horizon=Number(req.body?.horizon_days||process.env.LMS_REMINDER_DAYS||14);
  const now=Date.now(); const soon=en().filter((e:any)=> e.due && (new Date(e.due).getTime()-now) <= horizon*86400000 );
  soon.forEach(e=> append(REM,{ ts:Date.now(), subjectId:e.subjectId, courseId:e.courseId, due:e.due }) );
  res.json({ ok:true, reminders: soon.length });
});

r.get('/compliance/summary',(req,res)=>{
  // naive: % of enrollments completed per subject filter
  const subjectFilter=(sid:string)=> true; // placeholder for dept/role filters via IAM
  const enroll=en().filter((e)=>subjectFilter(e.subjectId));
  const completed=new Set(prog().filter((p:any)=>p.status==='completed').map((p:any)=>`${p.subjectId}:${p.courseId}`));
  const total=enroll.length, done=enroll.filter((e:any)=> completed.has(`${e.subjectId}:${e.courseId}`)).length;
  const pct = total? Number(((done/total)*100).toFixed(2)) : 0;
  append(CMP,{ ts:Date.now(), total, done, pct });
  res.json({ total, done, pct });
});

export default r;
