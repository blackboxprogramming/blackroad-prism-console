// FILE: /srv/blackroad-api/modules/lucidia-brain/tests/pssha.test.js
require.extensions['.ts'] = require.extensions['.js'];
const { computeDailyCode, verify } = require('../pssha');

const today = '2025-08-24';
const code = computeDailyCode(today);
console.assert(verify(code, today), 'pssha verify');
console.log('pssha.test.js ok');
