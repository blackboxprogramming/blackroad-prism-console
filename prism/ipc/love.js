const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('love').ping(input);
