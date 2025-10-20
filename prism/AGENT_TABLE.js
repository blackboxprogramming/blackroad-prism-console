const AGENT_TABLE = new Map();

function registerAgent(agent) {
  AGENT_TABLE.set(agent.name, agent);
}

function getAgent(name) {
  return AGENT_TABLE.get(name);
}

function clearAgents() {
  AGENT_TABLE.clear();
}

module.exports = { AGENT_TABLE, registerAgent, getAgent, clearAgents };
