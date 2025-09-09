// Truth quorum attestation tracker with optional Socket.IO broadcast

const Database = require('better-sqlite3');

module.exports = async function attachTruthQuorum({ app, io }) {
  if (!app) throw new Error('truth_quorum: need app');

  const DB_PATH = process.env.DB_PATH || '/srv/blackroad-api/blackroad.db';
  const db = () => new Database(DB_PATH);
  const all = (d, sql, params = []) => Promise.resolve(d.prepare(sql).all(params));
  const run = (d, sql, params = []) => Promise.resolve(d.prepare(sql).run(params));

  const nsp = io ? io.of('/trust') : null; // optional live channel

  app.post('/api/truth/attest', async (req, res) => {
    const o = req.body || {};
    const d = db();
    try {
      await run(d, `INSERT OR IGNORE INTO truth_quorum (cid,did,node,ts) VALUES (?,?,?,?)`, [o.cid, o.did, o.node || null, o.ts || Date.now()]);
      // broadcast live
      if (nsp) {
        const recents = await all(d, `SELECT COUNT(*) as c FROM truth_quorum WHERE cid=?`, [o.cid]);
        nsp.emit('attest', { cid: o.cid, did: o.did, node: o.node || null, ts: o.ts, count: recents?.[0]?.c || 1 });
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    } finally {
      d.close();
    }
  });

  console.log('[truth_quorum] mounted');
};
