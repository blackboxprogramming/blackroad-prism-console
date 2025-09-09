// Guard for JSON parsing + X-BlackRoad-Key auth (loopback allowed)
const fs = require('fs');
module.exports = function requestGuard(app){
  const keyPath = process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';
  let ORIGIN_KEY = ''; try { ORIGIN_KEY = fs.readFileSync(keyPath,'utf8').trim(); } catch {}
  app.use((req,res,next)=>{
    // parse JSON (small, safe)
    if (req.method !== 'GET' && (req.headers['content-type']||'').includes('application/json')) {
      let b=''; req.on('data',d=>b+=d); req.on('end',()=>{ try{ req.body = JSON.parse(b||'{}'); }catch{ req.body={}; } ; next(); });
    } else next();
  });
  app.use((req,res,next)=>{
    const ip = req.socket.remoteAddress || '';
    if (ip.startsWith('127.') || ip==='::1') return next();
    const k = req.get('X-BlackRoad-Key') || '';
    return (ORIGIN_KEY && k===ORIGIN_KEY) ? next() : res.status(401).json({ok:false, data:null, error:'unauthorized'});
  });
};
