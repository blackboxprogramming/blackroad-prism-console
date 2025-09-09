// Love Calculus: /api/love/score + helpers and ranking.
// Reads /etc/blackroad/love.yaml (optional). No external calls required.
const fs = require('fs'); const path = require('path');

function loadYaml(p){
  try { return require('yaml').parse(fs.readFileSync(p,'utf8')); } catch { return null; }
}
const CFG = loadYaml('/etc/blackroad/love.yaml') || {
  epsilon: 1e-4, bias: 0.0,
  weights: { positive:{truth:2,consent:1.6,benefit:1.4,reciprocity:1.2,transparency:1.0,reversibility:0.8},
             negative:{harm:2.2,coercion:2.0,scarcity:0.8,deception:1.4}},
  ranking: { tau_seconds: 172800, attest_gamma: 0.5 },
  led: { low:[180,40,40], mid:[230,170,40], high:[20,170,80], celebrate_threshold:0.85 }
};

function clamp01(x){ return Math.max(0, Math.min(1, Number.isFinite(x)?x:0)); }
function lift(x, eps){ x = clamp01(x); return Math.log((x+eps)/((1-x)+eps)); }
function sigmoid(z){ return 1 / (1 + Math.exp(-z)); }

function computeLove(feat){
  const e = CFG.epsilon;
  const w = CFG.weights;
  const p = feat || {};
  const t = lift(clamp01(p.truth        ?? p.t ?? 0.5), e);
  const c = lift(clamp01(p.consent      ?? p.c ?? 0.5), e);
  const b = lift(clamp01(p.benefit      ?? p.b ?? 0.5), e);
  const r = lift(clamp01(p.reciprocity  ?? p.r ?? 0.5), e);
  const y = lift(clamp01(p.transparency ?? p.y ?? 0.5), e);
  const v = lift(clamp01(p.reversibility?? p.v ?? 0.5), e);

  const h = lift(clamp01(p.harm         ?? p.h ?? 0.0), e);
  const q = lift(clamp01(p.coercion     ?? p.q ?? 0.0), e);
  const s = lift(clamp01(p.scarcity     ?? p.s ?? 0.0), e);
  const d = lift(clamp01(p.deception    ?? p.d ?? 0.0), e);

  // damp harm by reversibility (axiom 4)
  const harmTerm = w.negative.harm * (h / Math.max(0.25, (1 + (p.reversibility ?? p.v ?? 0.5))));

  const z = CFG.bias
          + w.positive.truth        * t
          + w.positive.consent      * c
          + w.positive.benefit      * b
          + w.positive.reciprocity  * r
          + w.positive.transparency * y
          + w.positive.reversibility* v
          - harmTerm
          - w.negative.coercion     * q
          - w.negative.scarcity     * s
          - w.negative.deception    * d;

  let L = sigmoid(z);

  // truth primacy floor (axiom 5): if near-zero truth, cap L
  const truthRaw = clamp01(p.truth ?? p.t ?? 0.5);
  if (truthRaw < 0.1) L = Math.min(L, 0.05);

  return { L, z, inputs:{t:truthRaw, c:clamp01(p.consent??0.5), b:clamp01(p.benefit??0.5),
                         r:clamp01(p.reciprocity??0.5), y:clamp01(p.transparency??0.5),
                         v:clamp01(p.reversibility??0.5), h:clamp01(p.harm??0), q:clamp01(p.coercion??0),
                         s:clamp01(p.scarcity??0), d:clamp01(p.deception??0)} };
}

function rankScore({ L, attestations=0, ageSeconds=0 }){
  const tau = CFG.ranking.tau_seconds;
  const rec = Math.exp(-ageSeconds / Math.max(1, tau));
  const boost = 1 + CFG.ranking.attest_gamma * Math.log(1 + Math.max(0, attestations));
  return L * rec * boost;
}

// color mapping for LEDs
function colorFor(L){
  const [lr,lg,lb] = CFG.led.low, [mr,mg,mb] = CFG.led.mid, [hr,hg,hb] = CFG.led.high;
  // 0..0.5: low->mid, 0.5..1: mid->high
  const mix = (a,b,t)=> Math.round(a*(1-t)+b*t);
  if (L < 0.5){
    const t = L/0.5; return [mix(lr,mr,t), mix(lg,mg,t), mix(lb,mb,t)];
  } else {
    const t = (L-0.5)/0.5; return [mix(mr,hr,t), mix(mg,hg,t), mix(mb,hb,t)];
  }
}

module.exports = function attachLove({ app }){
  app.post('/api/love/score', async (req,res)=>{
    let raw=''; req.on('data',d=>raw+=d); await new Promise(r=>req.on('end',r));
    let body={}; try{ body=JSON.parse(raw||'{}'); }catch{ return res.status(400).json({error:'bad json'}) }
    const f = body.features || body;
    const out = computeLove(f);
    const led = colorFor(out.L);
    res.json({ ...out, led_rgb: led });
  });

  // helpers for other modules
  app.locals.love = { computeLove, rankScore, colorFor };
  console.log('[love] calculus online');
};
