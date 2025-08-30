<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/operators.ts -->
const db = require('../../src/db');
const { logContradiction } = require('./contradictions');

function register(code, name, description) {
  try {
    db.prepare('INSERT INTO lbrain_operators (code, name, description) VALUES (?,?,?)').run(code, name, description);
  } catch (e) {
    logContradiction(null, 'Ψ′_TRUTH', 'warn', `operator ${code} register failed`);
  }
}

function list() {
  return db.prepare('SELECT code, name, description FROM lbrain_operators ORDER BY id').all();
}

module.exports = { register, list };
