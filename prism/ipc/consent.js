const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('consent').ping(input);
