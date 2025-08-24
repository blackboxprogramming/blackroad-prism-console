// Ephemeral in-memory store. Replace with DB in prod.
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const demoProjectId = uuidv4();

const store = {
  users: [
    {
      id: 'u-admin',
      username: 'admin',
      passwordHash: bcrypt.hashSync('adminpass', 10),
      role: 'admin',
      created_at: new Date().toISOString(),
      projectId: demoProjectId
    }
  ],
  sessions: [],
  wallet: { rc: 1.2 },
  agents: [
    { id: 'phi', name: 'Phi', status: 'idle', cpu: 0, memory: 0 },
    { id: 'gpt', name: 'GPT', status: 'idle', cpu: 0, memory: 0 },
    { id: 'mistral', name: 'Mistral', status: 'idle', cpu: 0, memory: 0 }
  ],
  contradictions: { issues: 2 },
  sessionNotes: "",
  guardian: {
    status: { secure: true, mfa: true, encryption: true, lastScan: '2025-08-20' },
    alerts: [
      { id: uuidv4(), type: 'Unauthorized login', severity: 'high', time: new Date().toISOString(), status: 'active' }
    ]
  },
  posts: [
    {
      id: uuidv4(),
      author: 'Admin',
      time: new Date().toISOString(),
      content: 'Welcome to BackRoad!\n\nShare updates with your fellow travelers.',
      likes: 0,
    },
  ],
  tasks: [
    { id: uuidv4(), projectId: demoProjectId, title: "Calculus HW 3", course: "Math 201", status: "todo", due: "2025-08-25", reward: 12, progress: 0.2 },
    { id: uuidv4(), projectId: demoProjectId, title: "Lab: Sorting", course: "CS 101", status: "inprogress", due: "2025-08-23", reward: 20, progress: 0.55 },
    { id: uuidv4(), projectId: demoProjectId, title: "Essay Draft", course: "ENG 210", status: "review", due: "2025-08-24", reward: 15, progress: 0.8 },
    { id: uuidv4(), projectId: demoProjectId, title: "Fix auth bug", course: "CS 101", status: "done", due: "2025-08-21", reward: 5, progress: 1.0 }
  ],
  commits: [
    { id: 'c1', hash: 'd1f6e52', author: 'Mistral agent', message: 'Revert last commit', time: new Date(Date.now()-3600e3).toISOString() },
    { id: 'c2', hash: 'a9c1b02', author: 'User', message: 'Add print("Hello, world!")', time: new Date(Date.now()-1800e3).toISOString() }
  ],
  projects: [
    { id: demoProjectId, name: 'Demo Project', status: 'active' }
  ],
  timeline: [
    { id: uuidv4(), type: 'agent', agent: 'Phi', text: "created a branch `main`", time: new Date().toISOString() },
    { id: uuidv4(), type: 'agent', agent: 'GPT', text: "ran a code generation (env: prod, branch: main)", time: new Date().toISOString() },
  ],
  lucidiaHistory: [],
  claudeHistory: [],
  codexRuns: []
};

function addTimeline(evt){
  const item = { id: uuidv4(), time: new Date().toISOString(), ...evt };
  store.timeline.unshift(item);
  return item;
}

module.exports = { store, addTimeline };
