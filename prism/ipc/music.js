const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('music').ping(input);
