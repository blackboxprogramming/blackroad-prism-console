const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('creativity').ping(input);
