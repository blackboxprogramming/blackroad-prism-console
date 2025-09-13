import fs from 'fs';
import fetch from 'node-fetch';

const ideas = fs.existsSync('data/product/ideas.jsonl')? fs.readFileSync('data/product/ideas.jsonl','utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const solved = ideas.filter((x:any)=>x.status==='done').slice(-10);
const text = solved.length ? `Closed the loop on ${solved.length} ideas:\n` + solved.map((x:any)=>`- ${x.title}`).join('\n') : 'No recently closed ideas.';
if (process.env.SLACK_WEBHOOK) {
  fetch(process.env.SLACK_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({text})}).catch(()=>null);
}
console.log('loop-posted');
