const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('sine').ping(input);
