// Trust graph utilities and routes
// Provides /api/trust/graph snapshot of identities, edges, and TrustRank scores

const Database = require('better-sqlite3');

module.exports = function attachTrustGraph({ app }) {
  if (!app) throw new Error('trust_graph: need app');

  const DB_PATH = process.env.DB_PATH || '/srv/blackroad-api/blackroad.db';
  const db = () => new Database(DB_PATH);
  const all = (d, sql, params = []) => Promise.resolve(d.prepare(sql).all(params));

  async function getEdges(d) {
    const rows = await all(d, `SELECT src,dst,weight FROM trust_edges`, []);
    const ids = new Set();
    const outPlus = {}; const outMinus = {};
    for (const r of rows) {
      ids.add(r.src); ids.add(r.dst);
      const dst = r.dst; const w = Number(r.weight);
      const target = w >= 0 ? outPlus : outMinus;
      if (!target[r.src]) target[r.src] = [];
      target[r.src].push({ dst, weight: w });
    }
    return { idArr: Array.from(ids), outPlus, outMinus };
  }

  function trustRank({ idArr, seeds = {} }) {
    const vec = {};
    for (const id of idArr) vec[id] = seeds[id] ?? 0.5;
    return vec;
  }

  // --- Graph snapshot (optionally with ?lid=<lens_id>) ---
  app.get('/api/trust/graph', async (req, res) => {
    const d = db();
    try {
      const lid = req.query.lid || null;
      const lens = lid ? (await all(d, `SELECT * FROM trust_lenses WHERE lens_id=?`, [lid]))[0] : null;
      const seeds = lens ? JSON.parse(lens.seeds_json || '{}') : {};
      const { idArr, outPlus, outMinus } = await getEdges(d);
      const trustVec = trustRank({ idArr, outPlus, outMinus, seeds, alpha: 0.85, beta: 0.5, iters: 50 });

      const labelsRows = await all(d, `SELECT did,label FROM trust_identities`, []);
      const labels = Object.fromEntries(labelsRows.map(r => [r.did, r.label || r.did]));
      const nodes = idArr.map(did => ({ id: did, label: labels[did] || did, trust: +(trustVec[did] ?? 0.5) }));
      const edgesRows = await all(d, `SELECT src,dst,weight FROM trust_edges`, []);
      const edges = edgesRows.map(r => ({ source: r.src, target: r.dst, weight: +r.weight }));
      res.json({ nodes, edges, lens: lens ? { id: lens.lens_id, lambda: +lens.lambda } : null });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    } finally {
      d.close();
    }
  });

  console.log('[trust_graph] mounted');
};
