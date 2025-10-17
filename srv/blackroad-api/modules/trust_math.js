// trust_math: edge curvature + canonical truth distance (CTD).
// Env: DB_PATH (/srv/blackroad-api/blackroad.db), IPFS_GATE (http://127.0.0.1:8080)

const sqlite3 = require('sqlite3').verbose();
const canonicalize = require('json-canonicalize');

const DB_PATH   = process.env.DB_PATH   || '/srv/blackroad-api/blackroad.db';
const IPFS_GATE = process.env.IPFS_GATE || 'http://127.0.0.1:8080';

function dbOpen(){ return new sqlite3.Database(DB_PATH); }
function all(db, sql, p=[]) { return new Promise((r,j)=>db.all(sql,p,(e,x)=>e?j(e):r(x))); }
function get(db, sql, p=[]) { return new Promise((r,j)=>db.get(sql,p,(e,x)=>e?j(e):r(x))); }

// ---- Graph helpers (mirror of trust_graph) ----
async function getEdges(db){
  const rows = await all(db, `SELECT src,dst,weight FROM trust_edges`);
  const idset = new Set();
  rows.forEach(r=>{ idset.add(r.src); idset.add(r.dst); });
  const idArr = Array.from(idset);
  const index = Object.fromEntries(idArr.map((d,i)=>[d,i]));
  const outPlus = Array(idArr.length).fill(0).map(()=>[]);
  const outMinus= Array(idArr.length).fill(0).map(()=>[]);
  for (const {src,dst,weight} of rows){
    const i = index[src], j = index[dst];
    if (i==null||j==null) continue;
    if (weight>0) outPlus[i].push({j,w:weight});
    else if (weight<0) outMinus[i].push({j,w:Math.abs(weight)});
  }
  return { idArr, index, outPlus, outMinus };
}
function normalizeOut(lists){
  return lists.map(row=>{
    const s = row.reduce((a,e)=>a+e.w,0);
    if (s<=0) return [];
    return row.map(e=>({j:e.j, p:e.w/s}));
  });
}
function trustRank({ idArr, outPlus, outMinus, seeds={}, alpha=0.85, beta=0.5, iters=50 }){
  const n = idArr.length; if (!n) return {};
  const Pp = normalizeOut(outPlus), Pm = normalizeOut(outMinus);
  const s = new Float64Array(n).fill(0); let ssum=0;
  for (const [did,val] of Object.entries(seeds)){
    const k = idArr.indexOf(did); if (k>=0){ s[k]=Math.max(0,Math.min(1,+val||0)); ssum+=s[k]; }
  }
  if (ssum===0){ s[0]=1; ssum=1; }
  for (let i=0;i<n;i++) s[i]/=ssum;

  let t = new Float64Array(n).fill(1/n), nxt = new Float64Array(n);
  for (let it=0; it<iters; it++){
    nxt.fill(0);
    for (let i=0;i<n;i++) for (const {j,p} of Pp[i]) nxt[j] += alpha*t[i]*p;
    for (let i=0;i<n;i++) for (const {j,p} of Pm[i]) nxt[j] -= alpha*beta*t[i]*p;
    for (let i=0;i<n;i++){ nxt[i] += (1-alpha)*s[i]; if (nxt[i]<0) nxt[i]=0; }
    let mx=0; for (let i=0;i<n;i++) if (nxt[i]>mx) mx=nxt[i];
    if (mx>0) for (let i=0;i<n;i++) nxt[i]/=mx;
    t.set(nxt);
  }
  const out={}; for (let i=0;i<n;i++) out[idArr[i]]=Math.max(0,Math.min(1,t[i])); return out;
}

// ---- Curvature (Ollivier-like overlap proxy) ----
// For node u, neighbor distribution m_u(x) ∝ max(0, w_{u→x}) * T(x)
// For negative edges, m^-_u similarly. κ(u,v) = overlap_pos(u,v) − overlap_neg(u,v)
// overlap = Σ_x min(m_u(x), m_v(x)); κ ∈ [−1,1] (clamped).
function distributions(row, trust){
  // row: normalized positive or negative outgoing with p weights (use p times T)
  const w = Object.create(null); let s=0;
  for (const {j,p} of row){
    const t = Math.max(0, trust[j] ?? 0.5);
    const val = p * t;
    if (val<=0) continue;
    w[j] = (w[j]||0) + val; s += val;
  }
  if (s<=0) return w;
  for (const k of Object.keys(w)) w[k] /= s;
  return w;
}
function overlap(distU, distV){
  let s=0;
  const keys = new Set([...Object.keys(distU), ...Object.keys(distV)]);
  for (const k of keys){
    const a = distU[k]||0, b = distV[k]||0;
    s += Math.min(a,b);
  }
  return Math.max(0, Math.min(1, s));
}

// ---- CTD (Canonical Truth Distance) ----
async function fetchTruth(cid){
  const r = await fetch(`${IPFS_GATE}/ipfs/${cid}`);
  if (!r.ok) throw new Error('ipfs gateway '+r.status);
  return await r.json();
}
function deepDiff(a, b, path='', ops=[]){
  if (a === b) return ops;
  const ta = Object.prototype.toString.call(a);
  const tb = Object.prototype.toString.call(b);
  if (ta !== tb){
    ops.push({op:'replace', path, from:a, to:b});
    return ops;
  }
  if (Array.isArray(a)){
    const n = Math.max(a.length, b.length);
    for (let i=0;i<n;i++){
      const p = path+'/'+i;
      if (i>=a.length)      ops.push({op:'add', path:p, to:b[i]});
      else if (i>=b.length) ops.push({op:'remove', path:p, from:a[i]});
      else deepDiff(a[i], b[i], p, ops);
    }
    return ops;
  }
  if (typeof a === 'object' && a){
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys){
      const p = path+'/'+k;
      if (!(k in b))        ops.push({op:'remove', path:p, from:a[k]});
      else if (!(k in a))   ops.push({op:'add', path:p, to:b[k]});
      else deepDiff(a[k], b[k], p, ops);
    }
    return ops;
  }
  // primitives unequal
  ops.push({op:'replace', path, from:a, to:b});
  return ops;
}

module.exports = function attachTrustMath({ app }){
  const db = dbOpen();

  // GET /api/trust/curvature?lid=ours&top=200
  app.get('/api/trust/curvature', async (req,res)=>{
    try{
      const lid = req.query.lid || null;
      const top = Math.max(1, Math.min(1000, +(req.query.top||200)));
      const { idArr, outPlus, outMinus } = await getEdges(db);

      // Seeds from lens (optional)
      let seeds = {};
      if (lid){
        const lens = await get(db, `SELECT seeds_json FROM trust_lenses WHERE lens_id=?`, [lid]);
        if (lens && lens.seeds_json) try{ seeds = JSON.parse(lens.seeds_json); }catch{}
      }
      const trustVec = trustRank({ idArr, outPlus, outMinus, seeds });
      const Pp = normalizeOut(outPlus), Pm = normalizeOut(outMinus);

      // Build edges list
      const edges = [];
      for (let i=0;i<idArr.length;i++){
        for (const {j,w} of outPlus[i]){
          edges.push({u:i,v:j,weight:w,sign:1});
        }
        for (const {j,w} of outMinus[i]){
          edges.push({u:i,v:j,weight:w,sign:-1});
        }
      }

      // Compute κ per unique unordered pair (u,v): we’ll keep directed but collapse same pair by avg
      const out = [];
      for (const e of edges){
        const mUpos = distributions(Pp[e.u], trustVec);
        const mVpos = distributions(Pp[e.v], trustVec);
        const mUneg = distributions(Pm[e.u], trustVec);
        const mVneg = distributions(Pm[e.v], trustVec);
        let kappa = overlap(mUpos, mVpos) - overlap(mUneg, mVneg); // [-1,1] ish
        if (!Number.isFinite(kappa)) kappa = 0;
        out.push({
          u: idArr[e.u], v: idArr[e.v],
          kappa: Math.max(-1, Math.min(1, kappa)),
          weight: e.weight * (e.sign>0? 1 : -1)
        });
      }
      // show worst tensions first
      out.sort((a,b)=> a.kappa - b.kappa);
      res.json(out.slice(0, top));
    }catch(e){ res.status(500).json({error:String(e)}) }
  });

  // GET /api/truth/diff?cid=a&cid2=b&alpha=1&beta=0.5
  app.get('/api/truth/diff', async (req,res)=>{
    try{
      const a = String(req.query.cid||''); const b = String(req.query.cid2||req.query.b||'');
      if (!a || !b) return res.status(400).json({error:'cid and cid2/b required'});
      const alpha = isFinite(+req.query.alpha) ? +req.query.alpha : 1.0;
      const beta  = isFinite(+req.query.beta)  ? +req.query.beta  : 1.0;

      const A = await fetchTruth(a); const B = await fetchTruth(b);

      // Canonicalize before diff to reduce cosmetic differences
      const Aj = JSON.parse(canonicalize(A));
      const Bj = JSON.parse(canonicalize(B));

      // proof mismatch: signature or publisher differ
      const aSig = A?.proof?.signature || A?.proof?.jws || null;
      const bSig = B?.proof?.signature || B?.proof?.jws || null;
      const aPub = A?.meta?.publisher || null;
      const bPub = B?.meta?.publisher || null;
      const proofMismatch = (aSig && bSig && aSig!==bSig) || (aPub && bPub && aPub!==bPub);

      const ops = deepDiff(Aj, Bj, '');
      const size = Math.max(1, ops.length + Math.max(JSON.stringify(Aj).length, JSON.stringify(Bj).length)/1000);
      let ctd = alpha * (ops.length/size) + beta * (proofMismatch? 1 : 0);
      if (!Number.isFinite(ctd)) ctd = 0;
      res.json({
        ctd, alpha, beta,
        proof_mismatch: !!proofMismatch,
        aPublisher: aPub, bPublisher: bPub,
        edit_ops: ops.slice(0, 500)    // cap for safety
      });
    }catch(e){ res.status(500).json({error:String(e)}) }
  });

  console.log('[trust_math] curvature + CTD endpoints online');
};
