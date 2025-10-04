// mTLS Relay for partners (e.g., Claude-as-teammate)
// Requires: Nginx mTLS in front; Nginx passes X-Client-Verify/X-Client-CN headers
// Injects origin.key server-side; allowlist device+type; JSON audit log.
const fs = require('fs');
const path = require('path');

module.exports = function attachPartnerRelay({ app }) {
  if (!app) throw new Error('partner_relay_mtls: need app');

  const ORIGIN_KEY_PATH = process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';
  const ALLOW_SUBJECTS = (process.env.PARTNER_SUBJECTS || 'Claude-Partner').split(',').map(s=>s.trim()).filter(Boolean);
  const ALLOW_DEVICES  = (process.env.PARTNER_DEVICES  || 'pi-01,alice-pi,jetson-01,display-mini,display-main').split(',').map(s=>s.trim()).filter(Boolean);
  const LOG_DIR = '/var/log/blackroad';
  const LOG_FILE = path.join(LOG_DIR, 'partner-relay.log');

  let ORIGIN_KEY = '';
  try { ORIGIN_KEY = fs.readFileSync(ORIGIN_KEY_PATH, 'utf8').trim(); } catch { console.warn('[partner] WARN: origin.key not found'); }
  try { if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, {recursive:true}); } catch {}

  const TYPES = new Set([
    'led.emotion',
    'display.show',
    'display.clear',
    'display.sleep',
    'display.wake',
    'fan.set'
  ]);

  function audit(obj){
    try { fs.appendFileSync(LOG_FILE, JSON.stringify(obj)+'\n'); } catch {}
  }
  function json(req, cb){
    let buf=''; req.on('data',d=>buf+=d); req.on('end',()=>{ try{cb(JSON.parse(buf||'{}'));}catch{cb({});} });
  }
  function denied(res, code, msg){ res.status(code).json({error:msg}); }

  app.post('/api/relay/partner/command', (req, res) => {
    const verified = req.get('X-Client-Verify') === 'SUCCESS';
    const cn = (req.get('X-Client-CN') || '').trim();
    const ip = req.socket.remoteAddress || '';
    if (!verified) return denied(res, 403, 'mtls_required');
    if (!ALLOW_SUBJECTS.includes(cn)) return denied(res, 403, 'subject_not_allowed');

    json(req, async (body) => {
      const t0 = Date.now();
      const device = (body && body.device || '').trim();
      const payload = body && body.payload || {};
      const typ = payload && payload.type;
      // schema guard
      if (!device)            return denied(res, 400, 'missing device');
      if (!ALLOW_DEVICES.includes(device)) return denied(res, 403, 'device_not_allowed');
      if (!typ || !TYPES.has(typ)) return denied(res, 400, 'type_not_allowed');
      if (typ === 'led.emotion' && !payload.emotion) return denied(res, 400, 'emotion_required');
      if (typ === 'display.show' && !(payload.target && payload.mode && payload.src)) return denied(res, 400, 'target/mode/src required');
      if (typ === 'fan.set' && (payload.pwm == null || payload.pwm < 0 || payload.pwm > 255)) return denied(res, 400, 'pwm 0-255 required');
      payload.ttl_s ??= 120;

      // forward to devices endpoint with server-side origin key
      try{
        const r = await fetch(`http://127.0.0.1:4000/api/devices/${encodeURIComponent(device)}/command`, {
          method: 'POST',
          headers: {'Content-Type':'application/json','X-BlackRoad-Key': ORIGIN_KEY},
          body: JSON.stringify(payload)
        });
        const text = await r.text();
        audit({ts:new Date().toISOString(), ip, cn, device, type:typ, code:r.status, dur_ms: Date.now()-t0});
        res.status(r.status).type('application/json').send(text);
      }catch(e){
        audit({ts:new Date().toISOString(), ip, cn, device, type:typ, code:502, err:String(e)});
        denied(res, 502, 'upstream_failed');
      }
    });
  });

  app.get('/api/relay/partner/devices', (req, res) => {
    const verified = req.get('X-Client-Verify') === 'SUCCESS';
    const cn = (req.get('X-Client-CN') || '').trim();
    if (!verified || !ALLOW_SUBJECTS.includes(cn)) return denied(res, 403, 'forbidden');
    res.json({ devices: ALLOW_DEVICES, types: Array.from(TYPES) });
  });

  console.log('[partner] mTLS relay attached; allow subjects=%s; devices=%s', ALLOW_SUBJECTS.join(','), ALLOW_DEVICES.join(','));
};
