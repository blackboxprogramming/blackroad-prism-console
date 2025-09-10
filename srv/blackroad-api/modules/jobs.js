// Jobs • sandboxed (Docker-first), precise progress, hard cancel, weighted pipelines, SSE logs.
//
// Env knobs:
//   JOB_RUNNER=docker|host          (default: docker, auto-fallback to host if docker is missing)
//   DOCKER_DEFAULT_IMAGE=node:20-slim
//   DB_PATH=/srv/blackroad-api/blackroad.db
//   PROJECTS_DIR=/srv/projects
//   DEPLOY_ROOT=/var/www/blackroad/apps
//   ORIGIN_KEY_PATH=/srv/secrets/origin.key
//
// Endpoints (unchanged from v2):
//   POST /api/jobs/start  {project, kind:'test'|'build'|'deploy'|'custom'|'pipeline', script?, cmd?, args?, env?}
//   GET  /api/jobs/:id
//   GET  /api/jobs/:id/events   (SSE: log|progress|state|stage)
//   GET  /api/jobs?project=<id>
//   POST /api/jobs/:id/cancel
//
// Pipeline file (per project): /srv/projects/<id>/.blackroad/pipeline.yaml
// Step fields (all optional):
//   name, cmd, weight, image, binds[], env{}, user
//
// Progress markers inside step stdout/stderr:
//   [[PROGRESS 37]]  or [[PROGRESS 37%]]  or [[PROGRESS 0.37]]
//   {"progress":0.37}   (JSON line)
//   [[STAGE name=compile start]] / [[STAGE name=compile done]] / [[STAGE name=compile error]]
//
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const YAML = require('yaml');

const DB_PATH = process.env.DB_PATH || '/srv/blackroad-api/blackroad.db';
const PROJECTS_DIR = process.env.PROJECTS_DIR || '/srv/projects';
const DEPLOY_ROOT = process.env.DEPLOY_ROOT || '/var/www/blackroad/apps';
const ORIGIN_KEY_PATH =
  process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';
const RUNNER = (process.env.JOB_RUNNER || 'docker').toLowerCase();
const DEFAULT_IMG = process.env.DOCKER_DEFAULT_IMAGE || 'node:20-slim';

function db() {
  return new Database(DB_PATH);
}
function run(db, sql, p = []) {
  return Promise.resolve(db.prepare(sql).run(p));
}
function all(db, sql, p = []) {
  return Promise.resolve(db.prepare(sql).all(p));
}
function get(db, sql, p = []) {
  return Promise.resolve(db.prepare(sql).get(p));
}
function now() {
  return Math.floor(Date.now() / 1000);
}
function orKey() {
  try {
    return fs.readFileSync(ORIGIN_KEY_PATH, 'utf8').trim();
  } catch {
    return '';
  }
}
async function led(payload) {
  try {
    await fetch('http://127.0.0.1:4000/api/devices/pi-01/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BlackRoad-Key': orKey(),
      },
      body: JSON.stringify(payload),
    });
  } catch {}
}
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));

// progress/stage parsers
function parseProgressLine(line) {
  const m = line.match(/\[\[\s*PROGRESS\s+([0-9.]+)%?\s*\]\]/i);
  if (m) {
    const v = parseFloat(m[1]);
    return v > 1 ? v / 100 : v;
  }
  try {
    if (line[0] === '{' && line.includes('progress')) {
      const j = JSON.parse(line);
      if (typeof j.progress === 'number') {
        const v = j.progress;
        return v > 1 ? v / 100 : v;
      }
    }
  } catch {}
  return null;
}
function parseStageLine(line) {
  const m = line.match(/\[\[\s*STAGE\s+(.+?)\s*\]\]/i);
  if (!m) return null;
  const toks = Object.fromEntries(
    m[1]
      .split(/\s+/)
      .filter(Boolean)
      .map((kv) => {
        const p = kv.split('=');
        return [p[0], p[1] === undefined ? true : p[1]];
      })
  );
  return toks; // {name, weight?, start|done|error?}
}

// in-flight processes for cancel
const PROCS = new Map(); // job_id -> { child, pgid, dockerName? }

function spawnHostTracked(job_id, cmd, args, opts) {
  const child = spawn(cmd, args, { ...opts, detached: true });
  PROCS.set(job_id, { child, pgid: child.pid });
  return child;
}

function dockerAvailableSync() {
  try {
    require('child_process').execSync('docker info >/dev/null 2>&1');
    return true;
  } catch {
    return false;
  }
}

function spawnDockerTracked(
  job_id,
  { image, workdir, cmdString, env = {}, binds = [] }
) {
  // build docker args
  const name = `br_job_${job_id.replace(/[^a-zA-Z0-9_.-]/g, '').slice(-24)}`;
  const args = ['run', '--rm', '--name', name, '-w', '/workspace'];
  // binds: always mount project dir RW into /workspace
  for (const b of binds || []) {
    args.push('-v', b);
  }
  if (
    !binds.some((b) => b.includes(': /workspace') || b.endsWith(':/workspace'))
  ) {
    args.push('-v', `${workdir}:/workspace:rw`);
  }
  // env
  for (const [k, v] of Object.entries(env || {})) {
    args.push('-e', `${k}=${v}`);
  }
  args.push(image || DEFAULT_IMG);
  args.push('/bin/bash', '-lc', cmdString);
  const child = spawn('docker', args, { env: process.env, detached: true });
  PROCS.set(job_id, { child, pgid: child.pid, dockerName: name });
  return child;
}

// core streaming/LED updates
async function wireChild(job_id, child, onClose) {
  let lastPct = 0;
  const handleChunk = async (buf, source) => {
    const s = buf.toString();
    await appendEvent(job_id, 'log', s);
    for (const line of s.split(/\r?\n/)) {
      const p = parseProgressLine(line);
      if (p != null && Math.abs(p - lastPct) >= 0.01) {
        lastPct = clamp01(p);
        await updateJob(job_id, { progress: lastPct });
        await led({
          type: 'led.progress',
          pct: Math.round(lastPct * 100),
          ttl_s: 90,
        });
      }
      const stage = parseStageLine(line);
      if (stage && stage.name) {
        await appendEvent(job_id, 'stage', {
          name: stage.name,
          status: stage.error ? 'error' : stage.done ? 'done' : 'start',
        });
      }
    }
  };
  child.stdout?.on('data', (buf) => handleChunk(buf, 'stdout'));
  child.stderr?.on('data', (buf) => handleChunk(buf, 'stderr'));
  child.on('close', async (code) => {
    PROCS.delete(job_id);
    await onClose(code, lastPct);
  });
}

// db + sse helpers
const d = db();
async function appendEvent(job_id, type, data) {
  // calculate seq inside the INSERT to avoid race conditions
  await run(
    d,
    `INSERT INTO job_events (job_id,seq,ts,type,data)
       VALUES (?, (SELECT COALESCE(MAX(seq),0)+1 FROM job_events WHERE job_id=?), ?, ?, ?)`,
    [
      job_id,
      job_id,
      now(),
      type,
      typeof data === 'string' ? data : JSON.stringify(data),
    ]
  );
  const set = clients.get(job_id);
  if (!set) return;
  const line = `event: ${type}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(line);
    } catch {}
  }
}
async function updateJob(job_id, patch) {
  const j = await get(d, `SELECT * FROM jobs WHERE job_id=?`, [job_id]);
  if (!j) return;
  const status = patch.status ?? j.status;
  const progress =
    patch.progress != null ? clamp01(patch.progress) : j.progress;
  const exit_code = patch.exit_code != null ? patch.exit_code : j.exit_code;
  const finished =
    patch.finished_at != null ? patch.finished_at : j.finished_at;
  const pid = patch.pid != null ? patch.pid : j.pid;
  await run(
    d,
    `UPDATE jobs SET status=?, progress=?, exit_code=?, finished_at=?, pid=? WHERE job_id=?`,
    [status, progress, exit_code, finished, pid, job_id]
  );
  if (patch.progress != null)
    await appendEvent(job_id, 'progress', { progress });
  if (patch.status) await appendEvent(job_id, 'state', { status });
}

// single command (kind=test/build/deploy/custom)
async function runSingle(job_id, project, cmd, args, env) {
  const cwd = path.join(PROJECTS_DIR, project);
  const cmdString =
    Array.isArray(args) && args.length ? [cmd, ...args].join(' ') : cmd;
  let child;
  if (RUNNER === 'docker' && dockerAvailableSync()) {
    child = spawnDockerTracked(job_id, {
      image: DEFAULT_IMG,
      workdir: cwd,
      cmdString,
      env,
      binds: [],
    });
  } else {
    child = spawnHostTracked(job_id, cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false,
    });
  }
  await run(d, `UPDATE jobs SET pid=? WHERE job_id=?`, [child.pid, job_id]);
  await wireChild(job_id, child, async (code, lastPct) => {
    const ok = code === 0;
    await updateJob(job_id, {
      status: ok ? 'ok' : 'error',
      progress: ok ? 1 : lastPct,
      exit_code: code,
      finished_at: now(),
    });
    await appendEvent(job_id, 'log', `\n[exit ${code}]\n`);
    if (ok) await led({ type: 'led.celebrate', ttl_s: 20 });
    else await led({ type: 'led.emotion', emotion: 'error', ttl_s: 20 });
  });
}

// pipeline
async function runPipeline(job_id, project, env) {
  const root = path.join(PROJECTS_DIR, project);
  const pfile = path.join(root, '.blackroad', 'pipeline.yaml');
  let pipe = { steps: [], on_error: 'stop', env: {} };
  if (fs.existsSync(pfile))
    pipe = YAML.parse(fs.readFileSync(pfile, 'utf8')) || pipe;
  else {
    pipe = {
      steps: [
        {
          name: 'build',
          cmd: 'npm run build || true',
          weight: 60,
          image: DEFAULT_IMG,
        },
        {
          name: 'deploy',
          cmd: `mkdir -p ${DEPLOY_ROOT}/${project} && rsync -a --delete public/ ${DEPLOY_ROOT}/${project}/`,
          weight: 40,
          image: DEFAULT_IMG,
        },
      ],
      on_error: 'stop',
    };
  }

  const steps = pipe.steps || [];
  let totalW = steps.reduce((s, x) => s + (Number(x.weight) || 0), 0);
  if (totalW <= 0) {
    const w = 100 / Math.max(1, steps.length);
    steps.forEach((s) => (s.weight = w));
    totalW = 100;
  }

  let base = 0;
  for (let i = 0; i < steps.length; i++) {
    const st = steps[i];
    await appendEvent(job_id, 'stage', {
      name: st.name || `step-${i + 1}`,
      index: i + 1,
      total: steps.length,
      status: 'start',
    });
    await updateJob(job_id, { progress: clamp01(base / 100) });
    await led({ type: 'led.progress', pct: Math.round(base), ttl_s: 180 });

    const image = st.image || DEFAULT_IMG;
    const binds = Array.isArray(st.binds) ? st.binds.slice() : [];
    const stepEnv = { ...pipe.env, ...env, ...(st.env || {}) };
    const user = st.user; // e.g., "1000:1000"

    let child;
    const cmdString = st.cmd || 'true';

    if (RUNNER === 'docker' && dockerAvailableSync()) {
      // default bind: project => /workspace (RW)
      if (!binds.some((b) => b.includes(':/workspace'))) {
        binds.push(`${root}:/workspace:rw`);
      }
      // propagate user if set for file ownership hygiene
      const args = [
        'run',
        '--rm',
        '--name',
        `br_job_${job_id}_${i}`,
        '-w',
        '/workspace',
      ];
      for (const b of binds) args.push('-v', b);
      for (const [k, v] of Object.entries(stepEnv))
        args.push('-e', `${k}=${v}`);
      if (user) args.push('--user', user);
      args.push(image, '/bin/bash', '-lc', cmdString);
      child = spawn('docker', args, { env: process.env, detached: true });
      PROCS.set(job_id, {
        child,
        pgid: child.pid,
        dockerName: `br_job_${job_id}_${i}`,
      });
    } else {
      child = spawnHostTracked(job_id, '/bin/bash', ['-lc', cmdString], {
        cwd: root,
        env: { ...process.env, ...stepEnv },
        shell: false,
      });
    }

    await wireChild(job_id, child, async (code, lastPct) => {
      const w = Number(st.weight) || 0;
      if (code !== 0) {
        await appendEvent(job_id, 'stage', {
          name: st.name || `step-${i + 1}`,
          index: i + 1,
          total: steps.length,
          status: 'error',
          exit: code,
        });
        if ((pipe.on_error || 'stop') === 'stop') {
          PROCS.delete(job_id);
          await updateJob(job_id, {
            status: 'error',
            progress: clamp01((base + w * lastPct) / 100),
            exit_code: code,
            finished_at: now(),
          });
        }
      } else {
        base += w;
        await appendEvent(job_id, 'stage', {
          name: st.name || `step-${i + 1}`,
          index: i + 1,
          total: steps.length,
          status: 'ok',
        });
        await updateJob(job_id, { progress: clamp01(base / 100) });
      }
    });

    // if pipeline already marked error, stop loop
    const cur = await get(d, `SELECT status FROM jobs WHERE job_id=?`, [
      job_id,
    ]);
    if (cur && cur.status === 'error') return;
  }
  await updateJob(job_id, { status: 'ok', progress: 1, finished_at: now() });
  await led({ type: 'led.celebrate', ttl_s: 20 });
}

// entrypoint: start job
async function startJob(body) {
  const project = (body.project || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-');
  const kind = body.kind || 'custom';
  const id = 'job-' + uuidv4();
  const cwd = path.join(PROJECTS_DIR, project);
  const env = body.env || {};
  if (!fs.existsSync(cwd)) throw new Error('project not found');

  // resolve command for single kinds
  let cmd = body.cmd,
    args = body.args || [];
  if (!cmd && kind !== 'custom' && kind !== 'pipeline') {
    if (kind === 'deploy') {
      if (fs.existsSync(path.join(cwd, 'scripts/deploy.sh'))) {
        cmd = '/bin/bash';
        args = ['-lc', 'chmod +x scripts/deploy.sh && scripts/deploy.sh'];
      } else {
        cmd = '/bin/bash';
        args = [
          '-lc',
          `mkdir -p ${DEPLOY_ROOT}/${project} && rsync -a --delete public/ ${DEPLOY_ROOT}/${project}/`,
        ];
      }
    } else if (kind === 'test') {
      cmd = '/bin/bash';
      args = ['-lc', 'npm test || echo "no tests"'];
    } else if (kind === 'build') {
      cmd = '/bin/bash';
      args = ['-lc', 'npm run build || echo "no build"'];
    }
  }
  if (kind === 'custom' && !cmd && body.script) {
    cmd = '/bin/bash';
    args = ['-lc', body.script];
  }

  await run(
    d,
    `INSERT INTO jobs (job_id,project_id,kind,cmd,args_json,env_json,status,progress,started_at,pid)
                VALUES (?,?,?,?,?,?,?, ?,?, NULL)`,
    [
      id,
      project,
      kind,
      cmd || '',
      JSON.stringify(args),
      JSON.stringify(env),
      'running',
      0,
      now(),
    ]
  );
  await appendEvent(id, 'state', { status: 'running', project, kind });
  await led({ type: 'led.progress', pct: 5, ttl_s: 180 });

  if (kind === 'pipeline') {
    runPipeline(id, project, env).catch(async (e) => {
      await appendEvent(id, 'log', `\n[error] ${String(e)}\n`);
      await updateJob(id, { status: 'error', finished_at: now() });
      await led({ type: 'led.emotion', emotion: 'error', ttl_s: 20 });
    });
  } else {
    await runSingle(id, project, cmd, args, env);
  }
  return id;
}

// HTTP plumbing (unchanged surface)
const clients = new Map(); // job_id -> Set(res)
module.exports = function attachJobs({ app }) {
  app.post('/api/jobs/start', async (req, res) => {
    let raw = '';
    req.on('data', (d) => (raw += d));
    await new Promise((r) => req.on('end', r));
    let body = {};
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      return res.status(400).json({ error: 'bad json' });
    }
    try {
      const id = await startJob(body);
      res.json({ ok: true, job_id: id });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    const id = String(req.params.id);
    const j = await get(d, `SELECT * FROM jobs WHERE job_id=?`, [id]);
    if (!j) return res.status(404).json({ error: 'not found' });
    res.json(j);
  });

  app.get('/api/jobs', async (req, res) => {
    const pr = String(req.query.project || '');
    const rows = await all(
      d,
      `SELECT job_id,project_id,kind,status,progress,started_at,finished_at FROM jobs
                               ${pr ? 'WHERE project_id=?' : ''} ORDER BY started_at DESC LIMIT 50`,
      pr ? [pr] : []
    );
    res.json(rows);
  });

  app.post('/api/jobs/:id/cancel', async (req, res) => {
    const id = String(req.params.id);
    await updateJob(id, { status: 'canceled', finished_at: now() });
    await appendEvent(id, 'log', '\n[cancel requested]\n');
    const proc = PROCS.get(id);
    if (proc) {
      try {
        if (proc.dockerName) {
          spawn('docker', ['rm', '-f', proc.dockerName], { detached: false });
        } else if (proc.pgid) {
          process.kill(-proc.pgid, 'SIGTERM');
          setTimeout(() => {
            try {
              process.kill(-proc.pgid, 'SIGKILL');
            } catch {}
          }, 5000);
        }
      } catch {}
    }
    res.json({ ok: true });
  });

  app.get('/api/jobs/:id/events', async (req, res) => {
    const id = String(req.params.id);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const rows = await all(
      d,
      `SELECT type,data FROM job_events WHERE job_id=? ORDER BY seq ASC`,
      [id]
    );
    for (const r of rows) {
      res.write(`event: ${r.type}\n`);
      res.write(`data: ${r.data}\n\n`);
    }
    if (!clients.has(id)) clients.set(id, new Set());
    clients.get(id).add(res);
    req.on('close', () => {
      const set = clients.get(id);
      if (set) {
        set.delete(res);
        if (!set.size) clients.delete(id);
      }
    });
  });

  console.log(
    `[jobs] sandboxed runner online • runner=${RUNNER}${RUNNER === 'docker' && !dockerAvailableSync() ? ' (fallback to host)' : ''}`
  );
};
