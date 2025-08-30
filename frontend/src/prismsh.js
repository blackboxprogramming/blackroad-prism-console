// Minimal shell helpers for local WebAssembly agents
import { spawnLocalAgent, sendMessage, recvMessage } from './localAgents.mjs';

export async function spawn(manifestUrl) {
  return spawnLocalAgent(manifestUrl);
}

export function send(agent, msg) {
  sendMessage(agent, msg);
}

export function recv(agent) {
  return recvMessage(agent);
}

export default { spawn, send, recv };
