// FILE: /srv/blackroad-api/modules/lucidia-brain/tests/english.test.js
require.extensions['.ts'] = require.extensions['.js'];
const { parse } = require('../english');

function testParse() {
  const res = parse('please remember "the code" and build plan');
  console.assert(res.intents.includes('recall'), 'should detect recall');
  console.assert(res.entities[0] === 'the code', 'entity');
  console.assert(res.intents.includes('build'), 'intent build');
}

testParse();
console.log('english.test.js ok');
