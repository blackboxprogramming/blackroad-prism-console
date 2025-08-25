const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('story').ping(input);
