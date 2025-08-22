const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
const dropletEnv = path.join(__dirname, '..', 'secrets', 'droplet.env');
if (fs.existsSync(dropletEnv)) {
  dotenv.config({ path: dropletEnv, override: true });
}

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { signToken, authMiddleware, nowISO } = require('./utils');
const { store, addTimeline } = require('./data');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*'}));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN?.split(',') || '*' } });

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ALLOW_SHELL = (process.env.ALLOW_SHELL || 'false').toLowerCase() === 'true';

// ---- Auth ----
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'root' && password === 'Codex2025') {
    const token = signToken({ uid: 'u-root', username: 'root', role: 'owner' }, JWT_SECRET, '12h');
    return res.json({ token, user: { id: 'u-root', username: 'root', displayName: 'Root', role: 'owner' }});
  }
  res.status(401).json({ error: 'invalid credentials' });
});

app.get('/api/auth/me', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ user: store.users[0] });
});

// ---- Public Info ----
app.get('/api/about', (req, res) => {
  res.json({ message: 'BlackRoad.io backend is running' });
});

app.get('/api/droplet', (req, res) => {
  res.json({
    ip: process.env.DROPLET_IP || null,
    fingerprint: process.env.DROPLET_HOST_FINGERPRINT_SHA256 || null,
  });
});

// ---- Data Endpoints ----
app.get('/api/timeline', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ timeline: store.timeline.slice(0, 50) });
});

app.get('/api/commits', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ commits: store.commits });
});

app.get('/api/tasks', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ tasks: store.tasks });
});

app.post('/api/tasks', authMiddleware(JWT_SECRET), (req, res)=>{
  const t = req.body;
  t.id = t.id || require('uuid').v4();
  store.tasks.push(t);
  addTimeline({ type: 'task', text: `New task created: ${t.title}`, by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item: store.timeline[0] });
  res.status(201).json({ ok: true, task: t });
});

app.patch('/api/tasks/:id', authMiddleware(JWT_SECRET), (req, res)=>{
  const idx = store.tasks.findIndex(t=>t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  store.tasks[idx] = { ...store.tasks[idx], ...req.body };
  res.json({ ok: true, task: store.tasks[idx] });
});

app.get('/api/agents', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ agents: store.agents });
});

app.get('/api/wallet', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ wallet: store.wallet });
});

app.get('/api/contradictions', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ contradictions: store.contradictions });
});

app.get('/api/notes', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ notes: store.sessionNotes });
});

app.post('/api/notes', authMiddleware(JWT_SECRET), (req, res)=>{
  store.sessionNotes = String(req.body?.notes || '');
  io.emit('notes:update', store.sessionNotes);
  res.json({ ok: true });
});

// Claude chat
app.post('/api/claude/chat', authMiddleware(JWT_SECRET), (req, res)=>{
  const prompt = String(req.body?.prompt || '');
  const response = `Claude heard: ${prompt}`;
  let sent = 0;
  const chunks = response.match(/.{1,10}/g) || [];
  const interval = setInterval(()=>{
    if (sent < chunks.length){
      io.emit('claude:chat', { chunk: chunks[sent], done: false });
      sent++;
    } else {
      io.emit('claude:chat', { done: true });
      store.claudeHistory.push({ prompt, response });
      clearInterval(interval);
    }
  }, 200);
  res.json({ ok: true });
});

app.get('/api/claude/history', authMiddleware(JWT_SECRET), (req, res)=>{
  res.json({ history: store.claudeHistory });
});

// Actions
app.post('/api/actions/run', authMiddleware(JWT_SECRET), (req,res)=>{
  const item = addTimeline({ type: 'action', text: 'Run triggered', by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item });
  res.json({ ok: true });
});

app.post('/api/actions/revert', authMiddleware(JWT_SECRET), (req,res)=>{
  const item = addTimeline({ type: 'action', text: 'Revert last change', by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item });
  res.json({ ok: true });
});

app.post('/api/actions/mint', authMiddleware(JWT_SECRET), (req,res)=>{
  store.wallet.rc += 0.05;
  const item = addTimeline({ type: 'wallet', text: 'Minted 0.05 RC', by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item });
  io.emit('wallet:update', store.wallet);
  res.json({ ok: true });
});

// Optional shell exec (guarded)
app.post('/api/exec', authMiddleware(JWT_SECRET), (req, res)=>{
  if (!ALLOW_SHELL) return res.status(403).json({ error: 'shell disabled' });
  const cmd = String(req.body?.cmd || '').slice(0, 256);
  exec(cmd, { timeout: 5000 }, (err, stdout, stderr)=>{
    res.json({ ok: !err, stdout, stderr, error: err?.message || null });
  });
});

// ---- Socket.IO ----
function randomWalk(prev, step=2, min=0, max=100){
  let v = prev + (Math.random()*2-1)*step;
  if (v < min) v = min; if (v > max) v = max;
  return Number(v.toFixed(1));
}

let cpu=35, mem=62, gpu=24;
setInterval(()=>{
  cpu = randomWalk(cpu, 3);
  mem = randomWalk(mem, 2);
  gpu = randomWalk(gpu, 1);
  io.emit('system:update', { cpu, mem, gpu, at: nowISO() });
}, 2000);

io.on('connection', (socket)=>{
  socket.emit('system:update', { cpu, mem, gpu, at: nowISO() });
  socket.emit('wallet:update', store.wallet);
  socket.emit('notes:update', store.sessionNotes);
});

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
});
