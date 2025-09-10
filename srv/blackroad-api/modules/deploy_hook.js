// Secure deploy hook + queue + LED + cache bump
const crypto = require('crypto');
const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');

const ORIGIN_KEY_PATH = process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';
const BR_DEPLOY_SECRET = process.env.BR_DEPLOY_SECRET || process.env.DEPLOY_SECRET || '';
const WEB_DIR = process.env.WEB_DIR || '/var/www/blackroad';
const REPO_DIR = process.env.REPO_DIR || '/srv/blackroad'; // your checked-out repo root
const API_SERVICE = process.env.API_SERVICE || 'blackroad-api';
const CF_ZONE = process.env.CF_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID || '';
const CF_TOKEN = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';
const { getStatus: getLlmStatus } = require('../routes/admin_llm');

function hmacOk(sigHeader, raw) {
  if (!sigHeader || !BR_DEPLOY_SECRET) return false;
  const sig = 'sha256=' + crypto.createHmac('sha256', BR_DEPLOY_SECRET).update(raw).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(sig)); } catch { return false; }
}
function bearerOk(authHeader) {
  if (!BR_DEPLOY_SECRET) return false;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return authHeader.slice(7).trim() === BR_DEPLOY_SECRET;
}
async function led(payload) {
  try {
    await fetch('http://127.0.0.1:4000/api/devices/pi-01/command', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-BlackRoad-Key': (process.env.ORIGIN_KEY || '')},
      body: JSON.stringify(payload)
    });
  } catch {}
}
function sh(cmd, opts={cwd:REPO_DIR}) {
  return new Promise((resolve,reject)=>{
    const p = spawn('/bin/bash', ['-lc', cmd], opts);
    let out=''; let err='';
    p.stdout.on('data', d=> out += d.toString());
    p.stderr.on('data', d=> err += d.toString());
    p.on('close', code => code===0 ? resolve({code,out,err}) : reject(new Error(err || ('exit '+code))));
  });
}

let DEPLOYING=false; const QUEUE=[];
async function runDeploy(job) {
  QUEUE.push(job);
  if (DEPLOYING) return;
  DEPLOYING = true;
  while (QUEUE.length) {
    const j = QUEUE.shift();
    try {
      await led({type:'led.emotion', emotion:'busy', ttl_s:90});
      // 1) pull latest
      await sh('git fetch --all --prune');
      await sh(`git checkout -f ${j.branch || 'main'}`);
      if (j.sha) await sh(`git reset --hard ${j.sha}`);
      else await sh('git reset --hard origin/HEAD');
      // 2) frontend build (assumes frontend in this repo; adjust path if needed)
      await sh('npm ci || true');
      await sh('npm run build || true');
      // 3) sync SPA
      await sh(`rsync -a --delete ./dist/ ${WEB_DIR}/ || rsync -a --delete ./public/ ${WEB_DIR}/ || true`, {cwd: REPO_DIR});
      // 4) restart API if server code changed (best-effort)
      await sh(`systemctl restart ${API_SERVICE} || true`, {cwd: REPO_DIR});
      // 5) reload nginx
      await sh('nginx -t && systemctl reload nginx || true', {cwd: REPO_DIR});
      // 6) Cloudflare purge (optional)
      if (CF_ZONE && CF_TOKEN) {
        await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/purge_cache`, {
          method:'POST',
          headers:{'Authorization':`Bearer ${CF_TOKEN}`,'Content-Type':'application/json'},
          body: JSON.stringify({ purge_everything: true })
        }).catch(()=>{});
      }
      // 7) bump build id
      const build = { sha: j.sha || (await sh('git rev-parse --short HEAD')).out.trim(), ts: new Date().toISOString() };
      fs.mkdirSync(WEB_DIR, {recursive:true});
      fs.writeFileSync(path.join(WEB_DIR,'.build-id'), JSON.stringify(build));
      await led({type:'led.celebrate', ttl_s:20});
      j.resolve({ok:true, build});
    } catch (e) {
      await led({type:'led.emotion', emotion:'error', ttl_s:20});
      j.reject(e);
    }
  }
  DEPLOYING=false;
}

module.exports = function attachDeployHook({ app }) {
  // /api/version
  app.get('/api/version', (_req,res)=>{
    try {
      const p = path.join(WEB_DIR,'.build-id');
      const j = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : null;
      const llm = getLlmStatus();
      res.json({ service:'blackroad-api', build: j || null, llm: { model: llm.model, warmed_at: llm.warmed_at } });
    } catch {
      res.json({ service:'blackroad-api', build:null, llm: getLlmStatus() });
    }
  });

  // minimal admin reload guarded by the deploy secret
  app.post('/api/admin/nginx/reload', async (req,res)=>{
    if (!bearerOk(req.headers.authorization)) return res.status(401).json({error:'unauthorized'});
    try { await sh('nginx -t && systemctl reload nginx || true'); res.json({ok:true}); }
    catch(e){ res.status(500).json({error:String(e)}) }
  });

  // deploy hook (GitHub or bearer)
  app.post('/api/deploy/hook', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    const sig = req.headers['x-hub-signature-256'];
    const auth = req.headers['authorization'];
    if (!(hmacOk(sig, raw) || bearerOk(auth))) return res.status(401).json({error:'unauthorized'});

    let body={}; try{ body=raw? JSON.parse(raw) : {}; }catch{}
    const sha = body.after || body.sha || (body.build && body.build.sha) || null;
    const branch = body.ref ? String(body.ref).split('/').pop() : (body.branch || null);
    const mode = (new URL(req.url,'http://localhost')).searchParams.get('mode') || null;

    // Allow deeper rebuild modes if requested
    if (mode==='rebuild') {/* nothing extra; future hook */}
    if (mode==='deep') {/* placeholder for npm ci clean, etc. */}

    const result = await new Promise((resolve,reject)=> runDeploy({sha, branch, resolve, reject}));
    res.json(result);
  });

  // partner/agent trigger (via mTLS relay → bearer)
  app.post('/api/deploy/trigger', async (req,res)=>{
    if (!bearerOk(req.headers.authorization)) return res.status(401).json({error:'unauthorized'});
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let body={}; try{ body=raw? JSON.parse(raw) : {}; }catch{}
    const sha = body.sha || null; const branch = body.branch || 'main';
    const result = await new Promise((resolve,reject)=> runDeploy({sha, branch, resolve, reject}));
    res.json(result);
  });

  console.log('[deploy] hook/version/admin endpoints ready');
};
