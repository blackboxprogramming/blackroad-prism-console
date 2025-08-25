const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('dream').ping(input);
