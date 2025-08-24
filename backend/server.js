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
const rateLimit = require('express-rate-limit');
const { signToken, authMiddleware, adminMiddleware, nowISO } = require('./utils');
const { authMiddleware, requireRole, signup, login, logout, JWT_SECRET } = require('./auth');
const { store, addTimeline } = require('./data');
const { nowISO } = require('./utils');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { logAudit, getAuditLogs } = require('./audit');

// Sample Roadbook data
const roadbookChapters = [
  {
    id: '1',
    title: 'Introduction',
    content: 'Welcome to the Roadbook. This chapter introduces the journey.'
  },
  {
    id: '2',
    title: 'Getting Started',
    content: 'Setup instructions and first steps with code snippets and images.'
  },
  {
    id: '3',
    title: 'Advanced Topics',
    content: 'Deep dive into advanced usage with rich examples.'
  }
];

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'invalid json' });
  }
  next(err);
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN?.split(',') || '*' } });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
const ALLOW_SHELL = (process.env.ALLOW_SHELL || 'false').toLowerCase() === 'true';

app.use('/api/', rateLimit({ windowMs: 60_000, max: 100 }));
app.use('/llm/', rateLimit({ windowMs: 60_000, max: 50 }));
app.use('/math/', rateLimit({ windowMs: 60_000, max: 50 }));

// ---- Auth ----
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'root' && password === 'Codex2025') {
    const token = signToken({ uid: 'u-root', username: 'root', role: 'owner' }, JWT_SECRET, '12h');
    logAudit('u-root', 'login', true);
    return res.json({ token, user: { id: 'u-root', username: 'root', displayName: 'Root', role: 'owner' }});
  }
  logAudit(username || 'unknown', 'login', false);
  res.status(401).json({ error: 'invalid credentials' });
});

app.get('/api/auth/me', authMiddleware(JWT_SECRET), (req, res) => {
  res.json({ user: store.users[0] });
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', authMiddleware, logout);
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = store.users.find(u => u.id === req.user.id);
  res.json({ user });
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
app.get('/api/timeline', authMiddleware, (req, res)=>{
  res.json({ timeline: store.timeline.slice(0, 50) });
});

app.get('/api/commits', authMiddleware, (req, res)=>{
  res.json({ commits: store.commits });
});

app.get('/api/tasks', authMiddleware, (req, res)=>{
  const tasks = store.tasks.filter(t => t.projectId === req.user.projectId);
  res.json({ tasks });
});

app.post('/api/tasks', authMiddleware(JWT_SECRET), (req, res)=>{
  const t = req.body || {};
  if (typeof t.title !== 'string' || !t.title.trim()) {
    return res.status(400).json({ error: 'invalid task' });
  }
  t.id = t.id || require('uuid').v4();
app.post('/api/tasks', authMiddleware, (req, res)=>{
  const t = req.body;
  t.id = t.id || uuidv4();
  if (t.projectId !== req.user.projectId) return res.status(403).json({ error: 'wrong_project' });
  store.tasks.push(t);
  addTimeline({ type: 'task', text: `New task created: ${t.title}`, by: req.user.id });
  io.emit('timeline:new', { at: nowISO(), item: store.timeline[0] });
  logAudit(req.user.uid, 'create_task', true);
  res.status(201).json({ ok: true, task: t });
});

app.patch('/api/tasks/:id', authMiddleware, (req, res)=>{
  const idx = store.tasks.findIndex(t=>t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  store.tasks[idx] = { ...store.tasks[idx], ...req.body };
  res.json({ ok: true, task: store.tasks[idx] });
});

app.delete('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = store.users.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  store.users.splice(idx, 1);
  res.json({ ok: true });
});

app.delete('/api/projects/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = store.projects.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  store.projects.splice(idx, 1);
  res.json({ ok: true });
});

app.get('/api/agents', authMiddleware, (req, res)=>{
  res.json({ agents: store.agents });
});

// Orchestrator APIs
app.get('/api/orchestrator/agents', authMiddleware, (req, res)=>{
  res.json({ agents: store.agents });
});

app.post('/api/orchestrator/control/:id', authMiddleware, (req, res)=>{
  const { action } = req.body || {};
  const id = req.params.id;
  const agent = store.agents.find(a => a.id === id);
  if (!agent) return res.status(404).json({ error: 'not found' });
  if (action === 'start') agent.status = 'running';
  else if (action === 'stop') agent.status = 'stopped';
  else if (action === 'restart') agent.status = 'running';
  res.json({ ok: true, agent });
});

app.get('/api/wallet', authMiddleware, (req, res)=>{
  res.json({ wallet: store.wallet });
});

app.get('/api/contradictions', authMiddleware, (req, res)=>{
  res.json({ contradictions: store.contradictions });
});

app.get('/api/notes', authMiddleware, (req, res)=>{
  res.json({ notes: store.sessionNotes });
});

app.post('/api/notes', authMiddleware, (req, res)=>{
  store.sessionNotes = String(req.body?.notes || '');
  io.emit('notes:update', store.sessionNotes);
  res.json({ ok: true });
});

app.get('/api/audit-logs', authMiddleware(JWT_SECRET), adminMiddleware, (req, res) => {
  res.json({ logs: getAuditLogs() });
});

// ---- Lucidia ----
app.get('/api/lucidia/history', (req, res) => {
  res.json({ history: store.lucidiaHistory });
});

app.post('/api/lucidia/chat', (req, res) => {
  const prompt = String(req.body?.prompt || '');
  const id = Date.now().toString();
  const full = `Lucidia response to: ${prompt}. This is a sample streamed reply.`;
  const parts = full.split(' ');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  let idx = 0;
  let acc = '';
  const interval = setInterval(() => {
    if (idx < parts.length) {
      const chunk = parts[idx] + ' ';
      res.write(chunk);
      acc += chunk;
      io.emit('lucidia:chat', { id, chunk });
      idx++;
    } else {
      clearInterval(interval);
      res.end();
      store.lucidiaHistory.push({ id, prompt, response: acc.trim() });
    }
  }, 200);
});

// Guardian endpoints
app.get('/api/guardian/status', authMiddleware, (req, res)=>{
  res.json(store.guardian.status);
});

app.get('/api/guardian/alerts', authMiddleware, (req, res)=>{
  res.json({ alerts: store.guardian.alerts });
});

app.post('/api/guardian/alerts/:id/resolve', authMiddleware, (req, res)=>{
  const alert = store.guardian.alerts.find(a=>a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'not found' });
  alert.status = req.body?.status || 'resolved';
  res.json({ ok: true, alert });
});

// Dashboard
app.get('/api/dashboard/system', authMiddleware, (req, res)=>{
  res.json({ cpu, gpu, memory: mem, network: net });
});

app.get('/api/dashboard/feed', authMiddleware, (req, res)=>{
  res.json({ events: store.timeline.slice(0, 20) });
});

// Personal profile
app.get('/api/you/profile', authMiddleware, (req, res)=>{
  const user = store.users[0];
  res.json({
    username: user.username,
    plan: user.plan || 'free',
    lastLogin: user.lastLogin || nowISO(),
    tasks: store.tasks,
    projects: store.projects || []
  });
});

// Claude chat
app.post('/api/claude/chat', authMiddleware, (req, res)=>{
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

app.get('/api/claude/history', authMiddleware, (req, res)=>{
  res.json({ history: store.claudeHistory });
});

// Codex
app.post('/api/codex/run', authMiddleware, (req, res)=>{
  const prompt = String(req.body?.prompt || '');
  const plan = [
    { step: 1, agent: 'Phi', action: 'Analyze prompt' },
    { step: 2, agent: 'GPT', action: 'Generate result' }
  ];
  const result = `Echo: ${prompt}`;
  const run = { id: uuidv4(), prompt, plan, result, time: nowISO() };
  store.codexRuns.unshift(run);
  io.emit('codex:run', run);
  res.json(run);
});

app.get('/api/codex/history', authMiddleware, (req, res)=>{
  res.json({ runs: store.codexRuns });
});

// Roadbook endpoints
app.get('/api/roadbook/chapters', authMiddleware, (req, res) => {
  const chapters = roadbookChapters.map(({ id, title }) => ({ id, title }));
  res.json({ chapters });
});

app.get('/api/roadbook/chapter/:id', authMiddleware, (req, res) => {
  const chapter = roadbookChapters.find(c => c.id === req.params.id);
  if (!chapter) return res.status(404).json({ error: 'not found' });
  res.json({ chapter });
});

app.get('/api/roadbook/search', authMiddleware, (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const results = roadbookChapters
    .filter(c => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q))
    .map(c => ({ id: c.id, title: c.title, snippet: c.content.slice(0, 80) }));
  res.json({ results });
});

// RoadView sample streams
app.get('/api/roadview/list', authMiddleware, (req, res)=>{
  res.json({ streams: [
    { id: 'cam-1', name: 'Main Street', status: 'offline' },
    { id: 'cam-2', name: 'Downtown', status: 'offline' }
  ]});
});

// ---- BackRoad feed ----

app.get('/api/backroad/feed', (req, res)=>{
  res.json({ posts: store.posts });
});

app.post('/api/backroad/post', (req, res)=>{
  const { title = '', body = '', author = 'Anon' } = req.body || {};
  const post = {
    id: uuidv4(),
    author,
    time: new Date().toISOString(),
    content: [title, body].filter(Boolean).join('\n\n'),
    likes: 0,
  };
  store.posts.unshift(post);
  res.status(201).json({ ok: true, post });
});

app.post('/api/backroad/like/:id', (req, res)=>{
  const post = store.posts.find(p=>p.id === req.params.id);
  if(!post) return res.status(404).json({ error: 'not found' });
  const delta = typeof req.body?.delta === 'number' ? req.body.delta : 1;
  post.likes = Math.max(0, post.likes + delta);
  res.json({ ok: true, likes: post.likes });
});

// Actions
app.post('/api/actions/run', authMiddleware, (req,res)=>{
  const item = addTimeline({ type: 'action', text: 'Run triggered', by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item });
  res.json({ ok: true });
});

app.post('/api/actions/revert', authMiddleware, (req,res)=>{
  const item = addTimeline({ type: 'action', text: 'Revert last change', by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item });
  res.json({ ok: true });
});

app.post('/api/actions/mint', authMiddleware, (req,res)=>{
  store.wallet.rc += 0.05;
  const item = addTimeline({ type: 'wallet', text: 'Minted 0.05 RC', by: req.user.username });
  io.emit('timeline:new', { at: nowISO(), item });
  io.emit('wallet:update', store.wallet);
  res.json({ ok: true });
});

// Optional shell exec (guarded)
app.post('/api/exec', authMiddleware, (req, res)=>{
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

let cpu=35, mem=62, gpu=24, net=40;
setInterval(()=>{
  cpu = randomWalk(cpu, 3);
  mem = randomWalk(mem, 2);
  gpu = randomWalk(gpu, 1);
  net = randomWalk(net, 5);
  io.emit('system:update', { cpu, mem, gpu, net, at: nowISO() });
}, 2000);

setInterval(()=>{
  store.agents.forEach(a => {
    a.cpu = randomWalk(a.cpu, 5);
    a.memory = randomWalk(a.memory, 5);
  });
  io.emit('orchestrator:metrics', store.agents.map(a => ({ id: a.id, cpu: a.cpu, memory: a.memory })));
}, 3000);

io.on('connection', (socket)=>{
  socket.emit('system:update', { cpu, mem, gpu, net, at: nowISO() });
  socket.emit('wallet:update', store.wallet);
  socket.emit('notes:update', store.sessionNotes);
  socket.emit('orchestrator:metrics', store.agents.map(a => ({ id: a.id, cpu: a.cpu, memory: a.memory })));
});

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Backend listening on http://${HOST}:${PORT}`);
  });
}
server.listen(PORT, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
});

module.exports = { app, server };
