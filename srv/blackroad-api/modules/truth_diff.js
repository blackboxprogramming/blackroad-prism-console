function diffJson(a, b, base = '') {
  const ops = [];
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      ops.push({ op: 'replace', path: base || '/', from: a, to: b });
    }
    return ops;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const path = `${base}/${k}`;
    if (!(k in a)) {
      ops.push({ op: 'replace', path, from: undefined, to: b[k] });
    } else if (!(k in b)) {
      ops.push({ op: 'replace', path, from: a[k], to: undefined });
    } else {
      ops.push(...diffJson(a[k], b[k], path));
    }
  });
  return ops;
}

const truths = {
  a: { meta: { title: 'A' }, proof: 'p1' },
  b: { meta: { title: 'B' }, proof: 'p1' },
};

module.exports = function attachTruthDiff({ app }) {
  app.get('/api/truth/diff', (req, res) => {
    let { cid } = req.query;
    if (!cid) return res.status(400).json({ error: 'missing cid' });
    if (!Array.isArray(cid)) cid = [cid];
    const [cidA, cidB] = cid;
    const j1 = truths[cidA];
    const j2 = truths[cidB];
    if (!j1 || !j2) return res.status(404).json({ error: 'not_found' });
    const ops = diffJson(j1, j2);
    const ctd = ops.length;
    res.json({ ctd, ops });
  });
};
