// Jobs: start/cancel/query + SSE logs. LED progress + celebrate/error.
// POST /api/jobs/start {project, kind, cmd?, args?, env?, cwd?}
// GET  /api/jobs/:id          -> job json
// GET  /api/jobs/:id/events   -> SSE (event: log|progress|state)
// POST /api/jobs/:id/cancel
// GET  /api/jobs?project=foo  -> recent jobs
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs'); const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || '/srv/blackroad-api/blackroad.db';
const PROJECTS_DIR = process.env.PROJECTS_DIR || '/srv/projects';
const ORIGIN_KEY_PATH = process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';

const d = new Database(DB_PATH);
function run(sql, p=[]) { return Promise.resolve(d.prepare(sql).run(...p)); }
function all(sql, p=[]) { return Promise.resolve(d.prepare(sql).all(...p)); }
function get(sql, p=[]) { return Promise.resolve(d.prepare(sql).get(...p)); }
function now(){ return Math.floor(Date.now()/1000); }
function orKey(){ try{ return fs.readFileSync(ORIGIN_KEY_PATH,'utf8').trim(); }catch{return ''} }

async function led(payload){
  try{
    await fetch('http://127.0.0.1:4000/api/devices/pi-01/command',{
      method:'POST', headers:{'Content-Type':'application/json','X-BlackRoad-Key': orKey()},
      body: JSON.stringify(payload)
    });
  }catch{}
}

function clamp01(x){ return Math.max(0, Math.min(1, x)); }

module.exports = function attachJobs({ app }){
  const clients = new Map(); // job_id -> Set(res)

  async function appendEvent(job_id, type, data){
    const row = await get(`SELECT max(seq)+1 AS n FROM job_events WHERE job_id=?`, [job_id]);
    const seq = row && row.n ? row.n : 1;
    await run(`INSERT INTO job_events (job_id,seq,ts,type,data) VALUES (?,?,?,?,?)`,
                 [job_id, seq, now(), type, (typeof data==='string'?data:JSON.stringify(data))]);
    // fan out SSE
    const set = clients.get(job_id); if (!set) return;
    const line = `event: ${type}\ndata: ${typeof data==='string'?data:JSON.stringify(data)}\n\n`;
    for (const res of set){ try{ res.write(line); }catch{} }
  }

  async function updateJob(job_id, patch){
    const j = await get(`SELECT * FROM jobs WHERE job_id=?`, [job_id]);
    if (!j) return;
    const status   = patch.status   ?? j.status;
    const progress = (patch.progress!=null) ? clamp01(patch.progress) : j.progress;
    const exit_code= patch.exit_code!=null ? patch.exit_code : j.exit_code;
    const finished = (patch.finished_at!=null) ? patch.finished_at : j.finished_at;
    await run(`UPDATE jobs SET status=?, progress=?, exit_code=?, finished_at=? WHERE job_id=?`,
                 [status, progress, exit_code, finished, job_id]);
    if (patch.progress!=null) await appendEvent(job_id, 'progress', {progress});
    if (patch.status)         await appendEvent(job_id, 'state', {status});
  }

  async function startJob(payload){
    const project = (payload.project || '').toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
    const kind = payload.kind || 'custom';
    const id = 'job-'+uuidv4();
    const cwd = payload.cwd || path.join(PROJECTS_DIR, project);
    let cmd = payload.cmd, args = payload.args || [];
    // defaults per kind
    if (!cmd){
      if (kind==='deploy'){
        // if project has scripts/deploy.sh use it, else copy /public -> deploy root
        if (fs.existsSync(path.join(cwd, 'scripts/deploy.sh'))){
          cmd = '/bin/bash'; args = ['-lc','chmod +x scripts/deploy.sh && scripts/deploy.sh'];
        } else {
          cmd = '/bin/bash'; args = ['-lc', `mkdir -p /var/www/blackroad/apps/${project} && rsync -a --delete public/ /var/www/blackroad/apps/${project}/`];
        }
      } else if (kind==='test'){
        cmd = '/bin/bash'; args = ['-lc', 'npm test || echo "no tests"'];
      } else if (kind==='build'){
        cmd = '/bin/bash'; args = ['-lc', 'npm run build || echo "no build"'];
      } else {
        cmd = '/bin/bash'; args = ['-lc', payload.script || 'echo "nothing to do"'];
      }
    }

    await run(`INSERT INTO jobs (job_id,project_id,kind,cmd,args_json,env_json,status,progress,started_at)
                  VALUES (?,?,?,?,?,?,?, ?,?)`,
              [id, project, kind, cmd, JSON.stringify(args), JSON.stringify(payload.env||{}), 'running', 0, now()]);

    // kick SSE listeners with initial state
    await appendEvent(id, 'state', {status:'running', project, kind});
    await led({type:'led.progress', pct:5, ttl_s:180});

    // spawn
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...(payload.env||{}) }, shell:false });
    // simple progress estimator: count lines & known hooks
    let lines=0;
    child.stdout.on('data', async (buf)=>{
      const s = buf.toString();
      lines += (s.match(/\n/g)||[]).length;
      await appendEvent(id, 'log', s);
      // naive progress bumps on key phrases
      const sn = s.toLowerCase();
      if (sn.includes('building')) await updateJob(id, {progress: 0.3});
      if (sn.includes('compiled') || sn.includes('bundle')) await updateJob(id, {progress: 0.6});
      if (sn.includes('deploy') || sn.includes('copy')) await updateJob(id, {progress: 0.8});
    });
    child.stderr.on('data', async (buf)=>{ await appendEvent(id, 'log', buf.toString()); });

    child.on('close', async (code)=>{
      const ok = (code===0);
      await updateJob(id, { status: ok?'ok':'error', progress: 1, exit_code: code, finished_at: now() });
      await appendEvent(id, 'log', `\n[exit ${code}]\n`);
      if (ok) await led({type:'led.celebrate', ttl_s:20}); else await led({type:'led.emotion', emotion:'error', ttl_s:20});
    });

    return id;
  }

  // --- Routes ---
  app.post('/api/jobs/start', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let body={}; try{ body=JSON.parse(raw||'{}'); }catch{ return res.status(400).json({error:'bad json'}) }
    try{
      const id = await startJob(body);
      res.json({ok:true, job_id:id});
    }catch(e){ res.status(500).json({error:String(e)}) }
  });

  app.get('/api/jobs/:id', async (req,res)=>{
    const id = String(req.params.id);
    const j = await get(`SELECT * FROM jobs WHERE job_id=?`, [id]);
    if (!j) return res.status(404).json({error:'not found'});
    res.json(j);
  });

  app.get('/api/jobs', async (req,res)=>{
    const pr = String(req.query.project||'');
    const rows = await all(`SELECT job_id,project_id,kind,status,progress,started_at,finished_at FROM jobs
                               ${pr?'WHERE project_id=?':''} ORDER BY started_at DESC LIMIT 50`, pr?[pr]:[]);
    res.json(rows);
  });

  app.post('/api/jobs/:id/cancel', async (req,res)=>{
    // simple: mark canceled; child process would need PID tracking to actually kill
    await updateJob(String(req.params.id), {status:'canceled', finished_at: now()});
    res.json({ok:true});
  });

  // SSE
  app.get('/api/jobs/:id/events', async (req,res)=>{
    const id = String(req.params.id);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    // send historical logs
    const rows = await all(`SELECT type,data FROM job_events WHERE job_id=? ORDER BY seq ASC`, [id]);
    for (const r of rows){
      res.write(`event: ${r.type}\n`);
      res.write(`data: ${r.data}\n\n`);
    }
    // subscribe
    if (!clients.has(id)) clients.set(id, new Set());
    clients.get(id).add(res);
    req.on('close', ()=>{ const set=clients.get(id); if(set){ set.delete(res); if(!set.size) clients.delete(id);} });
  });

  // expose helper for other modules
  app.locals.jobs = { start: startJob };
  console.log('[jobs] runner online');
};
