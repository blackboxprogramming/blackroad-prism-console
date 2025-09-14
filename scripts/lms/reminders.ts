import fs from 'fs';
const EN='data/lms/enrollments.jsonl', REM='data/lms/reminders.jsonl';
if(!fs.existsSync(EN)) process.exit(0);
const now=Date.now();
const rows=fs.readFileSync(EN,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const soon=rows.filter((e:any)=> e.due && (new Date(e.due).getTime()-now) <= Number(process.env.LMS_REMINDER_DAYS||14)*86400000);
fs.mkdirSync('data/lms',{recursive:true});
soon.forEach(e=> fs.appendFileSync(REM, JSON.stringify({ ts:Date.now(), ...e })+'\n') );
console.log('lms reminders generated:', soon.length);
