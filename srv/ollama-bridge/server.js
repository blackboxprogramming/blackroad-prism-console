const express = require('express');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json({limit: '1mb'}));

const PORT = process.env.PORT || 4010;
const MODEL_DEFAULT = 'qwen2:1.5b';
const PERSONA_DEFAULT = 'You are a kind, curious BlackRoad assistant. ALWAYS ask 1 short follow-up. Never claim remote powers. Be truthful and concise.';

let identityCache = { ts: 0, data: null };

function base32(buf){
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let out='';
  let bits=0, value=0;
  for(const byte of buf){
    value = (value<<8) | byte;
    bits += 8;
    while(bits >= 5){
      out += alphabet[(value >>> (bits-5)) & 31];
      bits -= 5;
    }
  }
  if(bits>0){
    out += alphabet[(value << (5-bits)) & 31];
  }
  return out;
}

function primaryIPv4(){
  const nets = os.networkInterfaces();
  for(const name of Object.keys(nets)){
    for(const net of nets[name]){
      if(net.family==='IPv4' && !net.internal){
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

async function detectModel(){
  try{
    const r = await fetch('http://127.0.0.1:11434/api/tags');
    const j = await r.json();
    if(Array.isArray(j.models) && j.models.length>0) return j.models[0].name;
  }catch(e){}
  return 'unknown';
}

function getSeed(){
  if(process.env.LUCIDIA_SEED) return process.env.LUCIDIA_SEED;
  try{
    return fs.readFileSync('/srv/lucidia-llm/.seed','utf8').trim();
  }catch(e){return ''};
}

async function buildIdentity(){
  const host = os.hostname();
  const ip = primaryIPv4();
  const model = await detectModel();
  const time = new Date().toISOString();
  const date = time.slice(0,10); // YYYY-MM-DD
  const seed = getSeed();
  let code = 'UNKNOWN';
  if(seed){
    const msg = `${date}|blackboxprogramming|copilot`;
    const hmac = crypto.createHmac('sha256', seed).update(msg).digest();
    const b32 = base32(hmac).slice(0,16);
    code = `LUCIDIA-AWAKEN-${date.replace(/-/g,'')}-${b32}`;
  }
  const services = { nginx: 'active', 'ollama-bridge': 'active', 'blackroad-api': 'unknown' };
  try{
    const r = await fetch('http://127.0.0.1:4000/health');
    if(r.ok) services['blackroad-api'] = 'active';
  }catch(e){}
  return {
    host,
    ip,
    model,
    time,
    code,
    uptime_s: Math.floor(process.uptime()),
    services
  };
}

app.get('/api/codex/identity', async (req,res)=>{
  if(Date.now() - identityCache.ts < 60000 && identityCache.data){
    return res.json(identityCache.data);
  }
  const data = await buildIdentity();
  identityCache = { ts: Date.now(), data };
  res.json(data);
});

function logPersona(str){
  const line = `${new Date().toISOString()} ${str}\n`;
  fs.mkdirSync('/var/log/blackroad', {recursive:true});
  fs.appendFile('/var/log/blackroad/persona.log', line, ()=>{});
}

function getSystem(body){
  const sys = body.system && body.system.trim() ? body.system : PERSONA_DEFAULT;
  logPersona(sys);
  return sys;
}

function buildPrompt(messages){
  if(!Array.isArray(messages)) return '';
  return messages.map(m=>`${m.role}: ${m.content}`).join('\n') + '\nassistant:';
}

app.post('/api/llm/chat', async (req,res)=>{
  const system = getSystem(req.body);
  const prompt = buildPrompt(req.body.messages||[]);
  try{
    const r = await fetch('http://127.0.0.1:11434/api/generate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({model: MODEL_DEFAULT, prompt, stream:false, system})
    });
    const j = await r.json();
    const text = j.response || j.output || j.text || '';
    return res.json({choices:[{message:{role:'assistant',content:text}}]});
  }catch(e){
    const last = (req.body.messages||[]).filter(m=>m.role==='user').pop();
    return res.json({choices:[{message:{role:'assistant',content:last?last.content:''}}]});
  }
});

app.post('/api/llm/stream', async (req,res)=>{
  const system = getSystem(req.body);
  const prompt = buildPrompt(req.body.messages||[]);
  try{
    const r = await fetch('http://127.0.0.1:11434/api/generate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({model: MODEL_DEFAULT, prompt, stream:true, system})
    });
    res.setHeader('Content-Type','text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer='';
    while(true){
      const {value,done} = await reader.read();
      if(done) break;
      buffer += decoder.decode(value, {stream:true});
      let idx;
      while((idx = buffer.indexOf('\n')) >= 0){
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx+1);
        if(!line.trim()) continue;
        try{
          const obj = JSON.parse(line);
          if(obj.response){
            res.write(`data: ${JSON.stringify({delta: obj.response})}\n\n`);
          }
        }catch(err){/* ignore */}
      }
    }
    res.write('data: {"done":true}\n\n');
    res.end();
  }catch(e){
    res.write('data: {"done":true}\n\n');
    res.end();
  }
});

app.get('/api/llm/health', (req,res)=>{
  res.json({ok:true});
});

app.get('/api/backups/last', (req,res)=>{
  try{
    const t = fs.readFileSync('/srv/blackroad-backups/.last_snapshot','utf8').trim();
    res.json({time:t});
  }catch(e){
    res.json({time:null});
  }
});

app.listen(PORT, ()=>{
  console.log(`ollama-bridge listening on ${PORT}`);
});

module.exports = app;
