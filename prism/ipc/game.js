const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('game').ping(input);
