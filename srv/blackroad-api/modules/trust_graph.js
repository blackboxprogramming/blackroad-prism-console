// Trust graph + lenses + ranked feed (Love ⨂ Trust).
// Uses signed TrustRank: t = (1-α)·s + α·(P+^T t - β P-^T t), clip to [0,1].
// Caches Truth objects from IPFS locally for fast ranking.

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const IPFS_API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const IPFS_GATE = process.env.IPFS_GATE || 'http://127.0.0.1:8080'; // for GET /ipfs/:cid
const DB_PATH = process.env.DB_PATH || '/srv/blackroad-api/blackroad.db';
const TRUTH_DIR = process.env.TRUTH_DIR || '/srv/truth';
const CACHE_DIR = path.join(TRUTH_DIR, 'cache');

function dbOpen() { return new sqlite3.Database(DB_PATH); }
function all(db, sql, p=[]) { return new Promise((r,j)=>db.all(sql,p,(e,x)=>e?j(e):r(x))); }
function run(db, sql, p=[]) { return new Promise((r,j)=>db.run(sql,p,function(e){e?j(e):r(this)})); }

async function getEdges(db){
  const rows = await all(db, `SELECT src,dst,weight FROM trust_edges`);
  const ids = new Set();
  rows.forEach(r=>{ids.add(r.src); ids.add(r.dst);});
  const idArr = Array.from(ids);
  const index = Object.fromEntries(idArr.map((d,i)=>[d,i]));
  // build outgoing lists for + and -
  const outPlus = Array(idArr.length).fill(0).map(()=>[]);
  const outMinus= Array(idArr.length).fill(0).map(()=>[]);
  for (const {src,dst,weight} of rows){
    const i = index[src], j = index[dst];
    if (weight > 0) outPlus[i].push({j,w:weight});
    else if (weight < 0) outMinus[i].push({j,w:Math.abs(weight)});
  }
  return { idArr, index, outPlus, outMinus };
}

function normalizeOut(lists){
  // convert outgoing weighted edges to row-stochastic probs
  return lists.map(arr=>{
    const sum = arr.reduce((s,e)=>s+e.w,0);
    if (sum <= 0) return [];
    return arr.map(e=>({j:e.j, p:e.w/sum}));
  });
}

function trustRank({ idArr, outPlus, outMinus, seeds={}, alpha=0.85, beta=0.5, iters=50 }){
  const n = idArr.length;
  if (n===0) return {};
  const Pp = normalizeOut(outPlus);
  const Pm = normalizeOut(outMinus);
  const s = new Float64Array(n).fill(0);
  let ssum = 0;
  for (const [did, val] of Object.entries(seeds)){
    const k = idArr.indexOf(did); if (k>=0){ s[k] = Math.max(0, Math.min(1, +val||0)); ssum += s[k]; }
  }
  if (ssum===0){ s[0]=1; ssum=1; } // fallback seed
  for (let i=0;i<n;i++) s[i]/=ssum;

  let t = new Float64Array(n).fill(1/n);
  let nxt = new Float64Array(n);
  for (let k=0;k<iters;k++){
    nxt.fill(0);
    // add positive walk
    for (let i=0;i<n;i++){
      const ti = t[i];
      const row = Pp[i];
      for (let e=0;e<row.length;e++){
        const {j,p} = row[e];
        nxt[j] += alpha * ti * p;
      }
    }
    // subtract negative influence
    for (let i=0;i<n;i++){
      const ti = t[i];
      const row = Pm[i];
      for (let e=0;e<row.length;e++){
        const {j,p} = row[e];
        nxt[j] -= alpha*beta * ti * p;
      }
    }
    // restart + clip
    for (let i=0;i<n;i++){
      nxt[i] += (1-alpha) * s[i];
      if (nxt[i] < 0) nxt[i]=0;
    }
    // normalize to [0,1] by max
    let mx=0; for (let i=0;i<n;i++) if (nxt[i]>mx) mx=nxt[i];
    if (mx>0){ for (let i=0;i<n;i++) nxt[i]/=mx; }
    // swap
    t.set(nxt);
  }
  const out = {};
  for (let i=0;i<n;i++) out[idArr[i]] = Math.max(0, Math.min(1, t[i]));
  return out;
}

async function fetchTruth(cid){
  fs.mkdirSync(CACHE_DIR, {recursive:true});
  const fp = path.join(CACHE_DIR, cid+'.json');
  if (fs.existsSync(fp)){
    try { return JSON.parse(fs.readFileSync(fp,'utf8')); } catch {}
  }
  // fetch from local IPFS gateway
  const r = await fetch(`${IPFS_GATE}/ipfs/${cid}`, { method:'GET' });
  if (!r.ok) throw new Error('ipfs fetch '+r.status);
  const txt = await r.text();
  fs.writeFileSync(fp, txt);
  return JSON.parse(txt);
}

function ageSeconds(tsIso){
  const t = +new Date(tsIso || Date.now());
  return Math.max(0, (Date.now()-t)/1000);
}

module.exports = function attachTrustGraph({ app }){
  const db = dbOpen();

  // identities
  app.post('/api/trust/identities', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let o={}; try{o=JSON.parse(raw||'{}');}catch{return res.status(400).json({error:'bad json'})}
    if (!o.did) return res.status(400).json({error:'did required'});
    try{
      await run(db, `INSERT OR IGNORE INTO trust_identities (did,label,created_at) VALUES (?,?,?)`, [o.did, o.label||null, Math.floor(Date.now()/1000)]);
      res.json({ok:true});
    }catch(e){ res.status(500).json({error:String(e)}); }
  });

  // add/replace edge
  app.post('/api/trust/edge', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let o={}; try{o=JSON.parse(raw||'{}');}catch{return res.status(400).json({error:'bad json'})}
    const {src,dst,weight,evidence} = o;
    if (!(src&&dst) || typeof weight!=='number') return res.status(400).json({error:'src,dst,weight required'});
    if (weight<-1 || weight>1) return res.status(400).json({error:'weight in [-1,1]'});
    try{
      await run(db, `INSERT INTO trust_edges (src,dst,weight,evidence_cid,created_at) VALUES (?,?,?,?,?)
                     ON CONFLICT(src,dst) DO UPDATE SET weight=excluded.weight, evidence_cid=excluded.evidence_cid, created_at=excluded.created_at`,
                [src,dst,weight,evidence||null, Math.floor(Date.now()/1000)]);
      res.json({ok:true});
    }catch(e){ res.status(500).json({error:String(e)}); }
  });

  // lenses
  app.post('/api/lenses', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let o={}; try{o=JSON.parse(raw||'{}');}catch{return res.status(400).json({error:'bad json'})}
    const id = (o.lens_id || o.id || 'lens-'+Math.random().toString(36).slice(2,8));
    const seeds = JSON.stringify(o.seeds||{});
    const loveOver = JSON.stringify(o.love_override||null);
    const lambda = Math.max(0, Math.min(1, +o.lambda ?? 0.6));
    try{
      await run(db, `INSERT OR REPLACE INTO trust_lenses (lens_id,label,lambda,seeds_json,love_override_json,created_at)
                     VALUES (?,?,?,?,?,?)`,
                [id, o.label||id, lambda, seeds, loveOver, Math.floor(Date.now()/1000)]);
      res.json({ok:true, lens_id:id});
    }catch(e){ res.status(500).json({error:String(e)}); }
  });
  app.get('/api/lenses', async (_req,res)=>{
    const rows = await all(db, `SELECT lens_id,label,lambda,seeds_json,love_override_json FROM trust_lenses ORDER BY created_at DESC`);
    res.json(rows.map(r=>({ lens_id:r.lens_id, label:r.label, lambda:r.lambda,
      seeds: (()=>{
        try{return JSON.parse(r.seeds_json||'{}');}catch{return {};}
      })(),
      love_override:(()=>{ try{return JSON.parse(r.love_override_json||'null');}catch{return null;}})()
    })));
  });

  // compute trust scores
  app.post('/api/trust/compute', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let o={}; try{o=JSON.parse(raw||'{}');}catch{}
    const { idArr,index,outPlus,outMinus } = await getEdges(db);
    const seeds = o.seeds || {};
    const t = trustRank({ idArr, outPlus, outMinus, seeds, alpha:o.alpha??0.85, beta:o.beta??0.5, iters:o.iters??50 });
    res.json(t);
  });

  // ranked feed with lens
  app.get('/api/truth/feed:lens', async (req,res)=>{
    try{
      const lid = req.query.lid || null;
      const lens = lid ? (await all(db, `SELECT * FROM trust_lenses WHERE lens_id=?`, [lid]))[0] : null;
      const seeds = lens ? JSON.parse(lens.seeds_json||'{}') : {};
      const lambda = lens ? +lens.lambda : 0.6;

      const { idArr,outPlus,outMinus } = await getEdges(db);
      const trustVec = trustRank({ idArr, outPlus, outMinus, seeds, alpha:0.85, beta:0.5, iters:50 });

      // load local feed
      const feedPath = path.join(TRUTH_DIR, 'feed.ndjson');
      const lines = fs.existsSync(feedPath) ? fs.readFileSync(feedPath,'utf8').trim().split('\n').filter(Boolean) : [];
      const rows = lines.slice(-500).map(x=>JSON.parse(x)).reverse();

      const out = [];
      for (const r of rows){
        try{
          const obj = await fetchTruth(r.cid);                // {title, meta.publisher, love, ...}
          const pub = obj?.meta?.publisher || obj?.meta?.did || 'unknown';
          const love = Math.max(0, Math.min(1, +obj?.love || 0.5));
          const attestCids = Array.isArray(obj?.evidence) ? obj.evidence : [];
          // NOTE: if you store attestors separately, pull their DIDs; here we just use publisher trust
          const T = Math.max(0, Math.min(1, trustVec[pub] ?? 0.5));
          const age = ageSeconds(obj?.meta?.created);
          const rec = Math.exp(-age/172800);  // ~2 days
          const attestBoost = 1 + 0.3*Math.log(1 + attestCids.length);
          const score = (lambda*love + (1-lambda)*T) * rec * attestBoost;

          out.push({ cid:r.cid, title:obj?.title||obj?.type||'(untitled)', publisher: pub, love, trust:T, score, created: obj?.meta?.created });
        }catch{}
      }
      out.sort((a,b)=>b.score-a.score);
      res.json(out.slice(0,200));
    }catch(e){ res.status(500).json({error:String(e)}) }
  });

  console.log('[trust] graph + lenses online');
};
