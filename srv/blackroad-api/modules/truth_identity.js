// Local Ed25519 identity -> did:key. Uses Node's crypto and bs58 for base58btc.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bs58 = require('bs58');

const DIR = process.env.TRUTH_DIR || '/srv/truth';
const SK = path.join(DIR, 'ed25519.sk.pem'); // PKCS8 PEM
const PK = path.join(DIR, 'ed25519.pk.pem'); // SPKI PEM
const ID = path.join(DIR, 'identity.json');

function ensureIdentity() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(SK)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(SK, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    fs.writeFileSync(PK, publicKey.export({ type: 'spki', format: 'pem' }));
  }
  const pub = crypto.createPublicKey(fs.readFileSync(PK));
  const raw = pub.export({ format: 'der', type: 'spki' }); // DER SPKI
  // Extract the 32-byte raw public key from SPKI DER (simple slice)
  const rawPub = raw.slice(-32);
  // did:key for ed25519 uses multicodec prefix 0xED 0x01 + raw pub, base58btc, prefixed 'z'
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), rawPub]);
  const mb = 'z' + bs58.encode(prefixed);
  const did = 'did:key:' + mb;
  const ident = { did, alg: 'Ed25519', kb: mb };
  fs.writeFileSync(ID, JSON.stringify(ident, null, 2));
  return ident;
}

function signJcs(jcsBytes) {
  const sk = crypto.createPrivateKey(fs.readFileSync(SK));
  const sig = crypto.sign(null, jcsBytes, sk); // raw Ed25519
  return Buffer.from(sig).toString('base64url');
}

function verifyJcs(jcsBytes, b64) {
  const pk = crypto.createPublicKey(fs.readFileSync(PK));
  return crypto.verify(null, jcsBytes, pk, Buffer.from(b64, 'base64url'));
}

module.exports = function attachTruthIdentity({ app }) {
  const ident = ensureIdentity();
  app.get('/api/truth/identity', (_req, res) => res.json(ident));
  app.locals.truthIdentity = { ...ident, signJcs, verifyJcs };
  console.log('[truth] identity ready:', ident.did);
};
