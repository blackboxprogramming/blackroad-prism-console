const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('paradox').ping(input);
