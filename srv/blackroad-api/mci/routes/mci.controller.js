const path = require('path');
const { spawn } = require('child_process');
const cache = require('../services/mci.cache');
const logger = require('../services/mci.logger');
const solver = require('./mci.solver');
const autodiff = require('./mci.autodiff');
const explain = require('./mci.explain');
const health = require('./mci.health');

function runPython(payload, timeout) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, '../sandbox/runner.py');
    const proc = spawn('python3', [script]);
    let out = '';
    let err = '';
    proc.stdout.on('data', d => (out += d));
    proc.stderr.on('data', d => (err += d));
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(err || 'runner error'));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(e);
      }
    });
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
    setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('timeout'));
    }, timeout);
  });
}

async function compute(req, res) {
  const payload = req.mci;
  const cacheKey = JSON.stringify({ expr: payload.expr, vars: payload.vars, mode: payload.mode, precision: payload.precision });
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.log({ rid: req.id, route: 'compute', cache_hit: true });
    return res.json({ ...cached, cache_hit: true });
  }
  try {
    const result = await runPython(payload, payload.timeout_ms);
    cache.set(cacheKey, result);
    logger.log({ rid: req.id, route: 'compute', cache_hit: false });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: 'BAD_INPUT', message: e.message });
  }
}

module.exports = {
  compute,
  solve: solver,
  autodiff,
  explain,
  health
};
