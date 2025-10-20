const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('geometry').ping(input);
