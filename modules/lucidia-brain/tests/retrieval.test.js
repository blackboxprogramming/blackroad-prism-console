// FILE: /srv/blackroad-api/modules/lucidia-brain/tests/retrieval.test.js
require.extensions['.ts'] = require.extensions['.js'];
const { indexMessage, search } = require('../retrieval');
const { addMessage, createSession } = require('../memory');

const s = createSession('test');
addMessage(s.session_id, 'user', 'hello world');
const res = search(s.session_id, 'hello');
console.assert(res.length >= 1, 'retrieval search');
console.log('retrieval.test.js ok');
