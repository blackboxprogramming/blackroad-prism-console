const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('trust').ping(input);
