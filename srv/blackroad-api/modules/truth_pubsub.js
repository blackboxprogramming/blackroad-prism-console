// Verified Truth PubSub (server): only pin/append when did:key signature checks out.
// Topic: TRUTH_TOPIC (default "truth.garden/v1/announce")
// Requires: npm i bs58 json-canonicalize ipfs-http-client
const { create } = require('ipfs-http-client');
const canonicalize = require('json-canonicalize');
const bs58 = require('bs58');
const fs = require('fs');

const TOPIC = process.env.TRUTH_TOPIC || 'truth.garden/v1/announce';
const IPFS_API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const TRUTH_DIR = process.env.TRUTH_DIR || '/srv/truth';
const FEED = TRUTH_DIR + '/feed.ndjson';
const MAX_AGE_SEC = Number(process.env.TRUTH_MAX_AGE_SEC || 7*24*3600); // 7 days
const ALLOW_DIDS = (process.env.TRUTH_ALLOW_DIDS || '').split(',').map(s=>s.trim()).filter(Boolean); // optional allowlist

function ensureFeed() { fs.mkdirSync(TRUTH_DIR, {recursive:true}); if (!fs.existsSync(FEED)) fs.writeFileSync(FEED,''); }

function didkeyToEd25519SPKI(did){
  // did:key: z + base58btc(multicodec: 0xED 0x01 + 32-byte pubkey)
  const z = did.startsWith('did:key:') ? did.slice(8) : did;
  if (!z.startsWith('z')) throw new Error('did:key must be base58btc (z...)');
  const bytes = Buffer.from(bs58.decode(z.slice(1)));
  if (bytes.length !== 34 || bytes[0] !== 0xED || bytes[1] !== 0x01) throw new Error('not ed25519 did:key');
  const raw = bytes.slice(2); // 32-byte raw ed25519 public key

  // Minimal SPKI DER for Ed25519: SEQ { SEQ { OID 1.3.101.112 }, BIT STRING 0x00 + pub }
  const derPrefix = Buffer.from([0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00]);
  return Buffer.concat([derPrefix, raw]); // type: 'spki', format: 'der'
}

function verifyMsg(o){
  // Required shape: {cid, did, type, ts, jcs:true, sig: base64url}
  if (!o || typeof o !== 'object') throw new Error('bad msg');
  const { cid, did, type, ts, sig } = o;
  if (!cid || !did || !sig || !type || !ts) throw new Error('missing fields');
  if (ALLOW_DIDS.length && !ALLOW_DIDS.includes(did)) throw new Error('did not allowed');
  const age = Math.abs(Date.now() - Date.parse(ts)) / 1000;
  if (!Number.isFinite(age) || age > MAX_AGE_SEC) throw new Error('msg too old');

  // Canonicalize only the signed fields (cid, did, type, ts), in RFC8785 order
  const payload = { cid, did, type, ts };
  const jcsBytes = Buffer.from(canonicalize(payload));

  // Verify Ed25519 with Node crypto + SPKI DER from did:key
  const crypto = require('crypto');
  const spki = didkeyToEd25519SPKI(did);
  const pub = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
  const ok = crypto.verify(null, jcsBytes, pub, Buffer.from(sig, 'base64url'));
  if (!ok) throw new Error('bad signature');
  return true;
}

module.exports = async function attachTruthPubSub({ app }){
  const ipfs = create({ url: IPFS_API });
  ensureFeed();

  // Subscriber (verified)
  await ipfs.pubsub.subscribe(TOPIC, async (msg) => {
    try {
      const text = new TextDecoder().decode(msg.data);
      const o = JSON.parse(text);
      verifyMsg(o);                      // ✨ gate everything
      await ipfs.pin.add(o.cid).catch(()=>{});
      fs.appendFileSync(FEED, JSON.stringify({ ts: Date.now(), cid: o.cid, did: o.did, kind:'announce', via:'pubsub-verified' })+'\n');

      // optional LED nudge
      try{
        await fetch('http://127.0.0.1:4000/api/devices/pi-01/command', {
          method:'POST', headers:{'Content-Type':'application/json','X-BlackRoad-Key': (process.env.ORIGIN_KEY||'')},
          body: JSON.stringify({type:'led.emotion', emotion:'busy', ttl_s:4})
        });
      }catch{}
    } catch(e) {
      // ignore invalid messages silently (or log if you want)
    }
  });

  // Publisher helper for truth_api
  app.locals.truthPub = {
    async announce(cid, type){
      const ident = app.locals.truthIdentity; // from truth_identity.js
      const payload = { cid, did: ident.did, type: type||'Truth', ts: new Date().toISOString() };
      const jcsBytes = Buffer.from(canonicalize(payload));
      const sig = ident.signJcs(jcsBytes);
      const msg = { ...payload, jcs:true, sig };
      await ipfs.pubsub.publish(TOPIC, new TextEncoder().encode(JSON.stringify(msg)));
    }
  };

  console.log('[truth] attest-pubsub verifier on topic %s', TOPIC);
};
