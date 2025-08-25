const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('curious').ping(input);
