#!/usr/bin/env node
// Device verifier/pinner (Pi/Jetson). Only pins messages with a valid did:key Ed25519 signature.
// Env: TRUTH_TOPIC, IPFS_API, TRUTH_MAX_AGE_SEC, ALLOW_DIDS (optional CSV allowlist)
const { create } = require('ipfs-http-client');
const canonicalize = require('json-canonicalize');
const bs58 = require('bs58');
const crypto = require('crypto');

const TOPIC = process.env.TRUTH_TOPIC || 'truth.garden/v1/announce';
const API   = process.env.IPFS_API    || 'http://127.0.0.1:5001';
const MAX_AGE_SEC = Number(process.env.TRUTH_MAX_AGE_SEC || 7*24*3600);
const ALLOW = (process.env.ALLOW_DIDS || '').split(',').map(s=>s.trim()).filter(Boolean);

function didkeyToSPKI(did){
  const z = did.startsWith('did:key:') ? did.slice(8) : did;
  if (!z.startsWith('z')) throw new Error('did not base58btc');
  const bytes = Buffer.from(bs58.decode(z.slice(1)));
  if (bytes.length !== 34 || bytes[0] !== 0xED || bytes[1] !== 0x01) throw new Error('not ed25519 did:key');
  const raw = bytes.slice(2);
  const derPrefix = Buffer.from([0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00]);
  return Buffer.concat([derPrefix, raw]);
}
function verify(o){
  const { cid, did, type, ts, sig } = o||{};
  if (!cid || !did || !sig || !type || !ts) throw new Error('missing fields');
  if (ALLOW.length && !ALLOW.includes(did)) throw new Error('did not allowed');
  const age = Math.abs(Date.now() - Date.parse(ts))/1000;
  if (!Number.isFinite(age) || age > MAX_AGE_SEC) throw new Error('too old');
  const jcs = Buffer.from(canonicalize({ cid, did, type, ts }));
  const pub = crypto.createPublicKey({ key: didkeyToSPKI(did), format: 'der', type: 'spki' });
  if (!crypto.verify(null, jcs, pub, Buffer.from(sig,'base64url'))) throw new Error('bad sig');
  return true;
}

const ipfs = create({ url: API });

(async ()=>{
  console.log('[subpin-verify] topic=%s api=%s allow=%s', TOPIC, API, ALLOW.length?ALLOW.join(','):'ALL');
  await ipfs.pubsub.subscribe(TOPIC, async (msg)=>{
    try{
      const text = new TextDecoder().decode(msg.data);
      const o = JSON.parse(text);
      verify(o);
      console.log('[subpin-verify] pin', o.cid, 'from', o.did);
      await ipfs.pin.add(o.cid).catch(()=>{});
    }catch(e){
      // ignore bad messages
    }
  });
})();
