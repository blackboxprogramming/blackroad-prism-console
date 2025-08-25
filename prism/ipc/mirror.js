const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('mirror').ping(input);
