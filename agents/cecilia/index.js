'use strict';

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class CeciliaAgent extends EventEmitter {
  constructor({ memoryApiUrl = 'http://localhost:3000', statePath } = {}) {
    super();
    this.memoryApiUrl = memoryApiUrl;
    this.statePath = statePath || path.resolve(__dirname, '../../home/agents/cecilia/state/current.json');
    this.logPath = path.resolve(__dirname, '../../home/agents/cecilia/logs/session.log');
  }

  profile() {
    const state = this.#readState();
    return {
      id: state.agent_id,
      join_code: state.join_code,
      capabilities: ['memory:index', 'memory:search', 'status:report'],
      memory_backend: state.memory_backend,
    };
  }

  memorySummary() {
    const logExists = fs.existsSync(this.logPath);
    const logTail = logExists ? fs.readFileSync(this.logPath, 'utf8').trim().split('\n').slice(-5) : [];
    return {
      logTail,
      memoryApiUrl: this.memoryApiUrl,
    };
  }

  exportProfile() {
    const profilePath = path.resolve(__dirname, '../../home/agents/cecilia/memory/profile.json');
    const payload = {
      profile: this.profile(),
      memory: this.memorySummary(),
      exported_at: new Date().toISOString(),
    };
    fs.mkdirSync(path.dirname(profilePath), { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify(payload, null, 2));
    return profilePath;
  }

  #readState() {
    try {
      const raw = fs.readFileSync(this.statePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      this.emit('error', error);
      return {
        agent_id: 'UNKNOWN',
        join_code: null,
        memory_backend: null,
      };
    }
  }
}

module.exports = {
  CeciliaAgent,
};
