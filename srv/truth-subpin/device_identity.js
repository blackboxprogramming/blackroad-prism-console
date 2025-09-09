// Ensure device Ed25519 keypair and compute did:key.
// Files: /srv/truth-subpin/ed25519.sk.pem (PKCS8), ed25519.pk.pem (SPKI)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bs58 = require('bs58');
const DIR = '/srv/truth-subpin';
const SK = path.join(DIR, 'ed25519.sk.pem');
const PK = path.join(DIR, 'ed25519.pk.pem');

function ensureIdentity() {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(SK)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(SK, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    fs.writeFileSync(PK, publicKey.export({ type: 'spki', format: 'pem' }));
  }
  const pub = crypto.createPublicKey(fs.readFileSync(PK));
  const der = pub.export({ format: 'der', type: 'spki' });
  const raw = der.slice(-32);
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), raw]);
  const mb = 'z' + bs58.encode(prefixed);
  return { did: 'did:key:' + mb };
}

function signJcs(bytes) {
  const sk = crypto.createPrivateKey(fs.readFileSync(SK));
  return Buffer.from(crypto.sign(null, bytes, sk)).toString('base64url');
}

module.exports = { ensureIdentity, signJcs };
