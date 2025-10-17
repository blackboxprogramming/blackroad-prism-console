// Publish/attest Truth Objects to IPFS with JCS + Ed25519.
// Endpoints:
//  - POST /api/truth/publish  {type,title,content,evidence?,tags?} -> {cid}
//  - POST /api/truth/attest   {cid, note?} -> {attestationCid}
//  - GET  /api/truth/feed     -> recent CIDs (local file)
const fs = require('fs');
const path = require('path');
const canonicalize = require('json-canonicalize');

const ORIGIN_KEY_PATH = process.env.ORIGIN_KEY_PATH || '/srv/secrets/origin.key';
const TRUTH_DIR = process.env.TRUTH_DIR || '/srv/truth';
const FEED = path.join(TRUTH_DIR, 'feed.ndjson');

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

let ipfsClientPromise;
function getIpfs() {
  if (!ipfsClientPromise) {
    ipfsClientPromise = import('ipfs-http-client').then(({ create }) =>
      create({ url: process.env.IPFS_API || 'http://127.0.0.1:5001' }),
    );
  }
  return ipfsClientPromise;
}

module.exports = function attachTruthApi({ app }) {
  const { truthIdentity } = app.locals;
  if (!truthIdentity) throw new Error('truth_api: identity not initialized');

  const ensureFeed = () => {
    fs.mkdirSync(TRUTH_DIR, { recursive: true });
    if (!fs.existsSync(FEED)) fs.writeFileSync(FEED, '');
  };

  app.post('/api/truth/publish', async (req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    await new Promise((r) => req.on('end', r));
    let o = {};
    try {
      o = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'bad json' });
    }
    if (!o.type || (!o.content && !o.title)) return res.status(400).json({ error: 'missing fields' });

    const data = {
      '@context': 'https://blackroad.io/truth/v1',
      type: o.type,
      title: o.title,
      content: o.content ?? null,
      evidence: Array.isArray(o.evidence) ? o.evidence : [],
      tags: Array.isArray(o.tags) ? o.tags : [],
      meta: { created: new Date().toISOString(), publisher: truthIdentity.did },
    };
    const jcs = Buffer.from(canonicalize(data));
    const sig = app.locals.truthIdentity.signJcs(jcs);
    const obj = {
      ...data,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: truthIdentity.did + '#keys-1',
        jcs: true,
        signature: sig,
      },
    };

    const ipfs = await getIpfs();
    const { cid } = await ipfs.add({ content: Buffer.from(JSON.stringify(obj)) });
    ensureFeed();
    fs.appendFileSync(
      FEED,
      JSON.stringify({ ts: Date.now(), cid: cid.toString(), did: truthIdentity.did }) + '\n',
    );
    led({ type: 'led.celebrate', ttl_s: 20 });
    res.json({ cid: cid.toString() });
  });

  app.post('/api/truth/attest', async (req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    await new Promise((r) => req.on('end', r));
    let o = {};
    try {
      o = JSON.parse(body || '{}');
    } catch {
      return res.status(400).json({ error: 'bad json' });
    }
    if (!o.cid) return res.status(400).json({ error: 'cid required' });

    const att = {
      '@context': 'https://blackroad.io/truth/v1',
      type: 'Attestation',
      about: o.cid,
      note: o.note || null,
      attestor: truthIdentity.did,
      created: new Date().toISOString(),
    };
    const jcs = Buffer.from(canonicalize(att));
    const sig = app.locals.truthIdentity.signJcs(jcs);
    const signed = {
      ...att,
      proof: {
        type: 'Ed25519Signature2020',
        verificationMethod: truthIdentity.did + '#keys-1',
        jcs: true,
        signature: sig,
      },
    };
    const ipfs = await getIpfs();
    const { cid } = await ipfs.add({ content: Buffer.from(JSON.stringify(signed)) });
    ensureFeed();
    fs.appendFileSync(
      FEED,
      JSON.stringify({ ts: Date.now(), cid: cid.toString(), did: truthIdentity.did, kind: 'attestation', about: o.cid }) +
        '\n',
    );
    res.json({ attestationCid: cid.toString() });
  });

  app.get('/api/truth/feed', (_req, res) => {
    ensureFeed();
    const lines = fs
      .readFileSync(FEED, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
    const last = lines.slice(-200).map((x) => JSON.parse(x)).reverse();
    res.json(last);
  });

  console.log('[truth] publish/attest/feed routes ready');
};
