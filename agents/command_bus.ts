import fs from 'fs';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

type Intent = { key:string; match:string[]; action:string; requires_approval?:boolean };
const intents: Intent[] = (() => {
  const y = require('yaml'); return (y.parse(fs.readFileSync('agents/intents.yaml','utf-8'))?.intents)||[];
})();

function detectIntent(text:string): Intent|undefined {
  const t = text.toLowerCase();
  return intents.find(i => i.match.some(m => t.includes(m.toLowerCase())));
}

export function enqueue(text:string, source='cli', user?:string){
  const i = detectIntent(text) || { key:'unknown', action:'noop', match:[] } as Intent;
  const task = { id: uuid(), ts: Date.now(), intent: i.key, action: i.action, source, user, text, status:'queued' };
  fs.mkdirSync('data/agents', { recursive: true });
  fs.appendFileSync('data/agents/queue.jsonl', JSON.stringify(task)+'\n');
  return task;
}
