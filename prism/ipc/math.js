const { getAgent } = require('../AGENT_TABLE');
module.exports = (input = '') => getAgent('math').ping(input);
