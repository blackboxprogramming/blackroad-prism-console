#!/usr/bin/env node
/**
 * LLM Prompt Evaluator (skip-safe)
 * - Loads YAML prompt sets from prompts/llm/*.yaml
 * - Calls Ollama if available (OLLAMA_URL, OLLAMA_MODEL), otherwise stubs
 * - Writes artifacts/llm-eval/<suite>.json with {prompt, response, latencyMs}
 * - Produces latency summary artifacts/llm-eval/latency.json
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import http from 'http';
const suitesDir = path.join(process.cwd(), 'prompts','llm');
const outDir = path.join(process.cwd(), 'artifacts','llm-eval');
fs.mkdirSync(outDir, { recursive: true });

function parseYAML(s){
  const out=[]; let cur=null, mode=null, inBlock=false, bkey='', buf=[];
  const lines=s.replace(/\r/g,'').split('\n');
  const flush=()=>{ if(inBlock){ cur[bkey]=buf.join('\n'); inBlock=false; buf=[]; } };
  for(const l of lines){
    if(/^\s*#/.test(l)) continue;
    if(/^\s*$/.test(l)){ if(inBlock) buf.push(''); continue; }
    if(inBlock){
      if(/^ {2}\S/.test(l) || /^ {4}/.test(l)){ buf.push(l.replace(/^ {2}/,'')); continue; } else { flush(); }
    }
    let m;
    if(/^\s*tasks:\s*$/.test(l)){ mode='tasks'; continue; }
    if(mode==='tasks'){
      if((m=l.match(/^\s*-\s+id:\s*(.+)$/))){ if(cur) out.push(cur); cur={ id:m[1].trim() }; continue; }
      if(!cur) continue;
      if((m=l.match(/^\s+prompt:\s*\|/))){ inBlock=true; bkey='prompt'; buf=[]; }
      else if((m=l.match(/^\s+expect_keywords:\s*\[(.*)\]\s*$/))){ cur.expect_keywords = m[1].split(',').map(x=>x.trim()).filter(Boolean); }
      else if((m=l.match(/^\s+meta:\s*\|/))){ inBlock=true; bkey='meta'; buf=[]; }
    }
  }
  if(cur) out.push(cur);
  return out;
}

function httpPostJSON(url, payload){
  return new Promise((resolve,reject)=>{
    if(!url) return reject(new Error('no url'));
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request({hostname:u.hostname,port:u.port|| (u.protocol==='https:'?443:80),path:u.pathname,method:'POST',headers:{'Content-Type':'application/json'}}, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode, body:d}));
    });
    req.on('error',reject); req.write(JSON.stringify(payload)); req.end();
  });
}

async function callOllama(prompt){
  const base = process.env.OLLAMA_URL || '';
  const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  if(!base) return { response: '(stub) OLLAMA_URL not set; skipping.', latencyMs: 0 };
  const start = Date.now();
  let attempt=0, backoff=500;
  while(attempt<3){
    try{
      const r = await httpPostJSON(`${base.replace(/\/$/,'')}/api/generate`, { model, prompt, stream:false });
      const latencyMs = Date.now()-start;
      let resp=''; try{ resp = JSON.parse(r.body).response || ''; }catch{ resp = r.body.slice(0,2000); }
      return { response: resp, latencyMs };
    }catch(e){ await new Promise(r=>setTimeout(r, backoff)); backoff*=2; attempt++; }
  }
  return { response: '(stub) Ollama not reachable; skipped.', latencyMs: 0 };
}

async function run(){
  if(!fs.existsSync(suitesDir)){ console.log('No prompts/llm; skipping.'); return; }
  const files = fs.readdirSync(suitesDir).filter(f=>/\.ya?ml$/.test(f));
  const latency = [];
  for(const f of files){
    const suite = parseYAML(fs.readFileSync(path.join(suitesDir,f),'utf8'));
    const results=[];
    for(const t of suite){
      const {response, latencyMs} = await callOllama(t.prompt || '');
      results.push({ id:t.id, prompt:t.prompt, response, expect_keywords:t.expect_keywords||[], latencyMs });
      if(latencyMs) latency.push(latencyMs);
    }
    fs.writeFileSync(path.join(outDir, f.replace(/\.ya?ml$/,'') + '.json'), JSON.stringify({ suite: f, results }, null, 2));
  }
  if(latency.length){
    const sorted=[...latency].sort((a,b)=>a-b);
    const p = q=> sorted[Math.floor((q/100)* (sorted.length-1))];
    const summary={ count:latency.length, p50:p(50), p90:p(90), p95:p(95), p99:p(99), avg: Math.round(latency.reduce((a,b)=>a+b,0)/latency.length) };
    fs.writeFileSync(path.join(outDir,'latency.json'), JSON.stringify(summary,null,2));
  }
  console.log('LLM eval complete.');
}
run().catch(e=>{ console.log('eval error (non-fatal):', e.message); process.exit(0); });
