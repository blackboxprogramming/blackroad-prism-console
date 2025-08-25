const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({path: path.join(__dirname,'.env')});
const { runChecks } = require('./checks');
const db = require('./db');
const { calculateSLO } = require('./slo');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
const logDir = '/var/log/watcher-bot';
fs.mkdirSync(logDir,{recursive:true});
const logStream = fs.createWriteStream(path.join(logDir,'access.log'),{flags:'a'});
app.use((req,res,next)=>{logStream.write(`${new Date().toISOString()} ${req.method} ${req.url}\n`); next();});

const PORT = process.env.PORT || 4200;
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'change-me';
const INTERVAL = Number(process.env.CHECK_INTERVAL_SECONDS || 60) * 1000;

let lastChecks = [];

async function executeChecks(){
  lastChecks = await runChecks();
}

// schedule
setInterval(executeChecks, INTERVAL);
executeChecks();

// endpoints
app.get('/api/watcher/health', async (req,res)=>{
  res.json({ ok: true, checks: lastChecks });
});

app.post('/api/watcher/run', async (req,res)=>{
  if(req.headers['x-internal-token'] !== INTERNAL_TOKEN) return res.status(401).json({ok:false});
  await executeChecks();
  res.json({ok:true});
});

app.get('/api/watcher/incidents', (req,res)=>{
  res.json(db.listIncidents());
});

app.post('/api/watcher/incidents/:id/ack', (req,res)=>{
  if(req.headers['x-internal-token'] !== INTERNAL_TOKEN) return res.status(401).json({ok:false});
  db.ackIncident(req.params.id);
  res.json({ok:true});
});

app.get('/api/watcher/metrics', (req,res)=>{
  const range = req.query.range || '24h';
  res.json(db.getMetrics(range));
});

app.listen(PORT, ()=>{
  console.log('Watcher bot listening on', PORT);
});
