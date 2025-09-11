export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    try {
      if (url.pathname === '/api/subscribe' && req.method === 'POST') {
        return handleSubscribe(req, env);
      }
      if (url.pathname === '/api/subscribe/confirm' && req.method === 'GET') {
        return handleConfirm(url, env);
      }
      if (url.pathname === '/api/unsubscribe' && req.method === 'POST') {
        return handleUnsubscribeStart(req, env);
      }
      if (url.pathname === '/api/unsubscribe/confirm' && req.method === 'GET') {
        return handleUnsubscribeConfirm(url, env);
      }
      if (url.pathname === '/api/subscribe/stats' && req.method === 'GET') {
        if (!await checkAdmin(req, env)) return text('forbidden', 403);
        return handleStats(env);
      }
      if (url.pathname === '/api/subscribe/export' && req.method === 'GET') {
        if (!await checkAdmin(req, env)) return text('forbidden', 403);
        return handleExport(env);
      }
      return text('not found', 404);
    } catch (e) {
      console.error('Worker error', e);
      return text('server error', 500);
    }
  }
};

function json(obj, status=200, headers={}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors(), ...headers }});
}
function text(t, status=200, headers={}) {
  return new Response(t, { status, headers: { 'content-type': 'text/plain; charset=utf-8', ...cors(), ...headers }});
}
function cors() {
  return { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type,x-admin-hmac' };
}

async function handleSubscribe(req, env) {
  const { email, name, turnstile } = await req.json().catch(() => ({}));
  if (!validEmail(email)) return text('invalid email', 400);
  if (env.TURNSTILE_SECRET && !(await verifyTurnstile(turnstile, req, env))) return text('turnstile failed', 400);

  // best-effort hourly rate limit
  const ip = req.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const keyRL = `rl:sub:${ip}:${hourKey()}`;
  const rl = parseInt(await env.BLACKROAD_SUBS.get(keyRL) || '0', 10);
  if (rl > 20) return text('rate limited', 429);
  await env.BLACKROAD_SUBS.put(keyRL, String(rl + 1), { expirationTtl: 3600 });

  const ts = new Date().toISOString();
  const token = await sha256hex(`${email}|confirm|${ts}|${Math.random()}`);
  const rec = { email: email.toLowerCase(), name: name||'', ts, status: env.DOUBLE_OPT_IN==='true' ? 'pending' : 'active', token };
  await env.BLACKROAD_SUBS.put(`sub:${rec.email}`, JSON.stringify(rec));
  if (env.DOUBLE_OPT_IN === 'true') {
    const confirmUrl = `https://${env.PROJECT}/api/subscribe/confirm?token=${token}&email=${encodeURIComponent(rec.email)}`;
    await sendMail(env, rec.email, 'Confirm your BlackRoad subscription', confirmText(confirmUrl), confirmHtml(confirmUrl));
  }
  return text('ok', 200);
}

async function handleConfirm(url, env) {
  const email = (url.searchParams.get('email')||'').toLowerCase();
  const token = url.searchParams.get('token')||'';
  const rec = await readRec(env, email);
  if (!rec) return text('not found', 404);
  if (rec.token !== token) return text('invalid token', 400);
  rec.status = 'active';
  rec.confirmed = new Date().toISOString();
  await env.BLACKROAD_SUBS.put(key(email), JSON.stringify(rec));
  return text('subscription confirmed — you may close this tab.', 200);
}

async function handleUnsubscribeStart(req, env) {
  const { email } = await req.json().catch(() => ({}));
  if (!validEmail(email)) return text('invalid email', 400);
  const rec = await readRec(env, email.toLowerCase());
  // Don't leak existence; still send a generic message
  const ts = new Date().toISOString();
  const token = await sha256hex(`${email}|unsub|${ts}|${Math.random()}`);
  if (rec) {
    rec.unsubToken = token;
    await env.BLACKROAD_SUBS.put(key(email), JSON.stringify(rec));
    const confirmUrl = `https://${env.PROJECT}/api/unsubscribe/confirm?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;
    await sendMail(env, email.toLowerCase(), 'Confirm unsubscribe (BlackRoad)', unsubText(confirmUrl), unsubHtml(confirmUrl));
  }
  return text('ok', 200);
}

async function handleUnsubscribeConfirm(url, env) {
  const email = (url.searchParams.get('email')||'').toLowerCase();
  const token = url.searchParams.get('token')||'';
  const rec = await readRec(env, email);
  if (!rec) return text('not found', 404);
  if (rec.unsubToken !== token) return text('invalid token', 400);
  rec.status = 'unsubscribed';
  rec.unsubscribed = new Date().toISOString();
  await env.BLACKROAD_SUBS.put(key(email), JSON.stringify(rec));
  return text('you are unsubscribed — you may close this tab.', 200);
}

async function handleStats(env) {
  let cursor = undefined, total=0, active=0, pending=0, unsub=0;
  do {
    const list = await env.BLACKROAD_SUBS.list({ prefix: 'sub:', cursor });
    for (const k of list.keys) {
      total++;
      const rec = JSON.parse(await env.BLACKROAD_SUBS.get(k.name));
      if (rec.status === 'active') active++;
      else if (rec.status === 'pending') pending++;
      else if (rec.status === 'unsubscribed') unsub++;
    }
    cursor = list.cursor;
  } while (cursor);
  return json({ total, active, pending, unsub });
}

async function handleExport(env) {
  let cursor = undefined;
  const rows = [['email','name','status','ts','confirmed','unsubscribed']];
  do {
    const list = await env.BLACKROAD_SUBS.list({ prefix: 'sub:', cursor });
    for (const k of list.keys) {
      const r = JSON.parse(await env.BLACKROAD_SUBS.get(k.name));
      rows.push([r.email||'', r.name||'', r.status||'', r.ts||'', r.confirmed||'', r.unsubscribed||'']);
    }
    cursor = list.cursor;
  } while (cursor);
  const csv = rows.map(cols => cols.map(escapeCsv).join(',')).join('\n');
  return new Response(csv, { status: 200, headers: { ...cors(), 'content-type':'text/csv; charset=utf-8', 'content-disposition':'attachment; filename="blackroad-subscribers.csv"' }});
}

/* helpers */
function key(email){ return `sub:${email.toLowerCase()}`; }
async function readRec(env, email){ return email ? JSON.parse(await env.BLACKROAD_SUBS.get(key(email)) || 'null') : null; }
function validEmail(e){ return !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }
function hourKey(){ return new Date().toISOString().slice(0,13); }

async function verifyTurnstile(token, req, env) {
  try {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', token || '');
    form.append('remoteip', req.headers.get('CF-Connecting-IP') || '');
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method:'POST', body: form });
    const j = await r.json();
    return !!j.success;
  } catch { return false; }
}

async function sendMail(env, to, subject, textBody, htmlBody) {
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: env.FROM_EMAIL, name: env.FROM_NAME || 'BlackRoad' },
      subject,
      content: [
        { type: 'text/plain', value: textBody },
        { type: 'text/html',  value: htmlBody }
      ]
    })
  });
  if (!res.ok) {
    const t = await res.text(); console.warn('MailChannels error', res.status, t.slice(0,200));
  }
}

function confirmText(url){ return `Confirm your subscription:\n${url}\n\nIf you didn't request this, ignore this email.`; }
function unsubText(url){ return `Confirm unsubscribe:\n${url}\n\nIf you didn't request this, ignore this email.`; }

function confirmHtml(url){
  return `<!doctype html><meta charset="utf-8">
  <div style="font-family:system-ui,Segoe UI,Roboto,Inter,sans-serif;color:#111">
    <h2 style="margin:0 0 12px">Confirm your subscription</h2>
    <p>Click the button below to confirm your email for BlackRoad updates.</p>
    <p><a href="${url}" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:linear-gradient(90deg,#FF4FD8,#0096FF);color:#0b0b12;font-weight:700">Confirm</a></p>
    <p style="color:#555555;font-size:12px">If you didn't request this, ignore this email.</p>
  </div>`;
}
function unsubHtml(url){
  return `<!doctype html><meta charset="utf-8">
  <div style="font-family:system-ui,Segoe UI,Roboto,Inter,sans-serif;color:#111">
    <h2 style="margin:0 0 12px">Confirm unsubscribe</h2>
    <p>Click below to stop receiving BlackRoad emails for this address.</p>
    <p><a href="${url}" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:linear-gradient(90deg,#FF4FD8,#0096FF);color:#0b0b12;font-weight:700">Unsubscribe</a></p>
    <p style="color:#555555;font-size:12px">If you didn't request this, ignore this email.</p>
  </div>`;
}

async function sha256hex(s) {
  const d = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest('SHA-256', d);
  return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function escapeCsv(v){
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

async function checkAdmin(req, env) {
  const secret = env.ADMIN_HMAC;
  if (!secret) return false;
  const sig = req.headers.get('X-Admin-HMAC') || req.headers.get('x-admin-hmac');
  if (!sig) return false;
  return timingSafeEqual(sig, secret);
}
function timingSafeEqual(a,b){ if (a.length !== b.length) return false; let out=0; for (let i=0;i<a.length;i++) out |= a.charCodeAt(i)^b.charCodeAt(i); return out===0; }
