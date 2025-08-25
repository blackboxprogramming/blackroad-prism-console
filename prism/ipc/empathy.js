const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('empathy').ping(input);
