const AGENT_TABLE = new Map();
function registerAgent(name, data) {
  AGENT_TABLE.set(name, data);
}
function unregisterAgent(name) {
  AGENT_TABLE.delete(name);
}
module.exports = { AGENT_TABLE, registerAgent, unregisterAgent };
