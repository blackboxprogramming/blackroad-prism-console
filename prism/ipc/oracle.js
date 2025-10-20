const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('oracle').ping(input);
