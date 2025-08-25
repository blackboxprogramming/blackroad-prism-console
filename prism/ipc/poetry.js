const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('poetry').ping(input);
