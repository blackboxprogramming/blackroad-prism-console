const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('godel').ping(input);
