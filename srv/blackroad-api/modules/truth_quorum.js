// Quorum subscriber + API: verifies PinAttestation messages and records quorum.
// Env: TRUTH_TOPIC (default "truth.garden/v1/announce"), TRUTH_MAX_AGE_SEC (default 7d)
//      QUORUM_TARGET (default 2) -> when reached, optional LED celebrate.
const canonicalize = require('json-canonicalize');
const bs58 = require('bs58');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const IPFS_API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const TOPIC = process.env.TRUTH_TOPIC || 'truth.garden/v1/announce';
const MAX_AGE = Number(process.env.TRUTH_MAX_AGE_SEC || 7 * 24 * 3600);
const QUORUM_TARGET = Number(process.env.QUORUM_TARGET || 2);
const DB_PATH = process.env.DB_PATH || '/srv/blackroad-api/blackroad.db';

function db() {
  return new sqlite3.Database(DB_PATH);
}
function run(db, sql, p = []) {
  return new Promise((r, j) =>
    db.run(sql, p, function (e) {
      e ? j(e) : r(this);
    }),
  );
}
function all(db, sql, p = []) {
  return new Promise((r, j) =>
    db.all(sql, p, (e, x) => (e ? j(e) : r(x))),
  );
}

function didkeyToSPKI(did) {
  const z = did.startsWith('did:key:') ? did.slice(8) : did;
  if (!z.startsWith('z')) throw new Error('did not base58btc');
  const bytes = Buffer.from(bs58.decode(z.slice(1)));
  if (bytes.length !== 34 || bytes[0] !== 0xed || bytes[1] !== 0x01)
    throw new Error('not ed25519 did:key');
  const raw = bytes.slice(2);
  // SPKI DER for Ed25519
  const derPrefix = Buffer.from([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
  ]);
  return Buffer.concat([derPrefix, raw]);
}

function verifyAttestation(o) {
  // expected: {cid, did, type:"PinAttestation", ts, node?, sig}
  const { cid, did, type, ts, node, sig } = o || {};
  if (!cid || !did || !type || !ts || !sig) throw new Error('missing fields');
  if (type !== 'PinAttestation') throw new Error('wrong type');
  const age = Math.abs(Date.now() - Date.parse(ts)) / 1000;
  if (!Number.isFinite(age) || age > MAX_AGE) throw new Error('too old');

  const payload = node ? { cid, did, type, ts, node } : { cid, did, type, ts };
  const jcs = Buffer.from(canonicalize(payload));
  const crypto = require('crypto');
  const pub = crypto.createPublicKey({
    key: didkeyToSPKI(did),
    format: 'der',
    type: 'spki',
  });
  const ok = crypto.verify(null, jcs, pub, Buffer.from(sig, 'base64url'));
  if (!ok) throw new Error('bad signature');
}

async function celebrateIf(db, cid) {
  const rows = await all(
    db,
    `SELECT COUNT(*) as c FROM truth_quorum WHERE cid=?`,
    [cid],
  );
  const c = rows?.[0]?.c || 0;
  if (c >= QUORUM_TARGET) {
    try {
      await fetch('http://127.0.0.1:4000/api/devices/pi-01/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BlackRoad-Key': process.env.ORIGIN_KEY || '',
        },
        body: JSON.stringify({ type: 'led.celebrate', ttl_s: 20 }),
      });
    } catch {}
  }
}

module.exports = async function attachTruthQuorum({ app }) {
  const { create } = await import('ipfs-http-client');
  const ipfs = create({ url: IPFS_API });
  const d = db();

  // Subscriber
  await ipfs.pubsub.subscribe(TOPIC, async (msg) => {
    try {
      const text = new TextDecoder().decode(msg.data);
      const o = JSON.parse(text);
      if (o?.type !== 'PinAttestation') return;
      verifyAttestation(o);

      // insert (ignore if exists)
      const ts = Math.floor(Date.parse(o.ts) / 1000) || Math.floor(Date.now() / 1000);
      await run(
        d,
        `INSERT OR IGNORE INTO truth_quorum (cid,did,node,ts) VALUES (?,?,?,?)`,
        [o.cid, o.did, o.node || null, ts],
      );

      await celebrateIf(d, o.cid);
    } catch (e) {
      // ignore invalid or old
    }
  });

  // API: quorum for a CID
  app.get('/api/truth/quorum', async (req, res) => {
    try {
      const cid = String(req.query.cid || '');
      if (!cid) return res.status(400).json({ error: 'cid required' });
      const rows = await all(
        d,
        `SELECT did,node,ts FROM truth_quorum WHERE cid=? ORDER BY ts DESC`,
        [cid],
      );
      res.json({ cid, count: rows.length, attestors: rows });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // API: recent attestations
  app.get('/api/truth/quorum/recent', async (_req, res) => {
    try {
      const rows = await all(
        d,
        `SELECT cid,did,node,ts FROM truth_quorum ORDER BY ts DESC LIMIT 200`,
        [],
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  console.log(
    '[truth] quorum verifier online (topic %s, target %d)',
    TOPIC,
    QUORUM_TARGET,
  );
};
