// Guard for JSON parsing + X-BlackRoad-Key auth (loopback allowed)
const fs = require('fs');
module.exports = function requestGuard(app){
  const keyPath = process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';
  let ORIGIN_KEY = ''; try { ORIGIN_KEY = fs.readFileSync(keyPath,'utf8').trim(); } catch {}
  const SKIP = ['/api/normalize', '/slack/command', '/slack/interact'];
  const skip = (p) => SKIP.some(s => p === s || p.startsWith(s + '/'));
  app.use((req, res, next) => {
    if (skip(req.path)) return next();
    // parse JSON (small, safe) while preserving the raw payload for webhook validation
    const contentType = req.headers['content-type'] || '';
    const shouldParse =
      req.method !== 'GET' && contentType.includes('application/json');
    if (!shouldParse) return next();

    const chunks = [];
    let finished = false;
    const finalize = (err) => {
      if (finished) return;
      finished = true;
      if (err) return next(err);
      next();
    };

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('error', (err) => finalize(err));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      req.rawBody = raw;
      if (!raw) {
        req.body = {};
        return finalize();
      }
      try {
        req.body = JSON.parse(raw);
      } catch {
        req.body = {};
      }
      finalize();
    });
  });
  app.use((req,res,next)=>{
    if (skip(req.path)) return next();
    const ip = req.socket.remoteAddress || '';
    if (ip.startsWith('127.') || ip==='::1') return next();
    const k = req.get('X-BlackRoad-Key') || '';
    return (ORIGIN_KEY && k===ORIGIN_KEY) ? next() : res.status(401).json({ok:false, data:null, error:'unauthorized'});
  });
};
