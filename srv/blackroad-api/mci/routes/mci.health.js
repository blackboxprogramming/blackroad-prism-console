const { spawnSync } = require('child_process');
const cache = require('../services/mci.cache');

module.exports = (req, res) => {
  let versions = {};
  try {
    const py = spawnSync('python3', ['-c', 'import json, sympy, mpmath; print(json.dumps({"sympy": sympy.__version__, "mpmath": mpmath.__version__}))']);
    versions = JSON.parse(py.stdout.toString() || '{}');
  } catch (e) {
    versions = { error: 'python_missing' };
  }
  res.json({ ok: true, versions, cache: cache.stats(), capabilities: { compute: true, solve: false, autodiff: false, explain: false } });
};
