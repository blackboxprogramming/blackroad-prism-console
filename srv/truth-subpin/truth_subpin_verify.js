#!/usr/bin/env node
// Verified subpin + device attestation publisher.
const canonicalize = require('json-canonicalize');
const bs58 = require('bs58');
const crypto = require('crypto');
const os = require('os');
const { ensureIdentity, signJcs } = require('./device_identity');

const TOPIC = process.env.TRUTH_TOPIC || 'truth.garden/v1/announce';
const API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const MAX_AGE_SEC = Number(process.env.TRUTH_MAX_AGE_SEC || 7 * 24 * 3600);
const ALLOW = (process.env.ALLOW_DIDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function didkeyToSPKI(did) {
  const z = did.startsWith('did:key:') ? did.slice(8) : did;
  if (!z.startsWith('z')) throw new Error('did not base58btc');
  const bytes = Buffer.from(bs58.decode(z.slice(1)));
  if (bytes.length !== 34 || bytes[0] !== 0xed || bytes[1] !== 0x01)
    throw new Error('not ed25519 did:key');
  const raw = bytes.slice(2);
  const derPrefix = Buffer.from([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
  ]);
  return Buffer.concat([derPrefix, raw]);
}
function verify(o) {
  const { cid, did, type, ts, sig } = o || {};
  if (!cid || !did || !sig || !type || !ts) throw new Error('missing fields');
  const age = Math.abs(Date.now() - Date.parse(ts)) / 1000;
  if (!Number.isFinite(age) || age > MAX_AGE_SEC) throw new Error('too old');
  if (ALLOW.length && !ALLOW.includes(did)) throw new Error('did not allowed');
  const jcs = Buffer.from(canonicalize({ cid, did, type, ts }));
  const pub = crypto.createPublicKey({
    key: didkeyToSPKI(did),
    format: 'der',
    type: 'spki',
  });
  if (!crypto.verify(null, jcs, pub, Buffer.from(sig, 'base64url')))
    throw new Error('bad sig');
  return true;
}

let ipfs;
const ident = ensureIdentity();

async function publishAttestation(cid) {
  const payload = {
    cid,
    did: ident.did,
    type: 'PinAttestation',
    node: os.hostname(),
    ts: new Date().toISOString(),
  };
  const jcs = Buffer.from(canonicalize(payload));
  const sig = signJcs(jcs);
  const msg = { ...payload, jcs: true, sig };
  await ipfs.pubsub.publish(TOPIC, new TextEncoder().encode(JSON.stringify(msg)));
}

(async () => {
  const { create } = await import('ipfs-http-client');
  ipfs = create({ url: API });

  console.log(
    '[subpin-verify] api=%s topic=%s DID=%s allow=%s',
    API,
    TOPIC,
    ident.did,
    ALLOW.length ? ALLOW.join(',') : 'ALL',
  );
  await ipfs.pubsub.subscribe(TOPIC, async (msg) => {
    try {
      const text = new TextDecoder().decode(msg.data);
      const o = JSON.parse(text);
      if (o.type !== 'Truth' && o.type !== 'Note' && o.type !== 'Announcement')
        return; // only pin content announces
      verify(o);
      await ipfs.pin.add(o.cid).catch(() => {});
      await publishAttestation(o.cid);
      console.log('[subpin-verify] pinned & attested', o.cid);
    } catch (e) {
      // ignore invalid/old
    }
  });
})();
