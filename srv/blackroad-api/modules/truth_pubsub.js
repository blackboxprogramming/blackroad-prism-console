// Publishes/consumes Truth Garden pubsub and auto-pins locally.
// Topic: truth.garden/v1/announce
const { create } = require('ipfs-http-client');
const canonicalize = require('json-canonicalize');
const fs = require('fs');
const crypto = require('crypto');

const TOPIC = process.env.TRUTH_TOPIC || 'truth.garden/v1/announce';
const IPFS_API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const FEED_APPEND = (line) => {
  try {
    fs.mkdirSync('/srv/truth', { recursive: true });
    fs.appendFileSync('/srv/truth/feed.ndjson', line + '\n');
  } catch {}
};

function ensureIdentity() {
  const path = '/srv/truth/identity.json';
  try {
    const raw = fs.readFileSync(path, 'utf8');
    const data = JSON.parse(raw);
    const key = crypto.createPrivateKey({
      key: Buffer.from(data.privateKey, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });
    return {
      did: data.did,
      signJcs(buf) {
        return crypto.sign(null, buf, key).toString('base64');
      },
    };
  } catch {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    const did = 'did:key:' + publicKey.export({ format: 'der', type: 'spki' }).toString('base64');
    fs.mkdirSync('/srv/truth', { recursive: true });
    fs.writeFileSync(
      path,
      JSON.stringify({
        did,
        privateKey: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
      })
    );
    return {
      did,
      signJcs(buf) {
        return crypto.sign(null, buf, privateKey).toString('base64');
      },
    };
  }
}

module.exports = async function attachTruthPubSub({ app }) {
  const ipfs = create({ url: IPFS_API });
  const ident = app.locals.truthIdentity || ensureIdentity();
  app.locals.truthIdentity = ident;

  // Subscriber: pin on receipt (simple allow-all; you can add DID allowlist later)
  await ipfs.pubsub.subscribe(TOPIC, async (msg) => {
    try {
      const text = new TextDecoder().decode(msg.data);
      const o = JSON.parse(text);
      if (!o?.cid) return;
      // Pin locally
      await ipfs.pin.add(o.cid).catch(() => {});
      FEED_APPEND(
        JSON.stringify({ ts: Date.now(), cid: o.cid, did: o.did, kind: 'announce', via: 'pubsub' })
      );
      // Optional: LED nudge locally via backplane (server)
      try {
        await fetch('http://127.0.0.1:4000/api/devices/pi-01/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BlackRoad-Key': process.env.ORIGIN_KEY || '',
          },
          body: JSON.stringify({ type: 'led.emotion', emotion: 'busy', ttl_s: 5 }),
        });
      } catch {}
    } catch (_) {}
  });

  // Expose a helper publisher for truth_api to call
  app.locals.truthPub = {
    async announce(cid, type) {
      const payload = {
        cid,
        did: ident.did,
        type: type || 'Truth',
        ts: new Date().toISOString(),
      };
      const jcs = Buffer.from(canonicalize(payload));
      const sig = app.locals.truthIdentity.signJcs(jcs);
      const msg = { ...payload, jcs: true, sig };
      await ipfs.pubsub.publish(TOPIC, new TextEncoder().encode(JSON.stringify(msg)));
    },
  };

  console.log('[truth] pubsub wired on topic %s', TOPIC);
};
