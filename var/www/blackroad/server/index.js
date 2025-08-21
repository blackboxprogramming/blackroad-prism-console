const express = require('express');
const cors = require('cors');
const ai = require('./routes/ai');
const agent = require('./routes/agent');
const git = require('./routes/git');
const term = require('./routes/term');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/ai/complete', ai.streamComplete); // SSE
app.post('/api/agent/task', agent.runTask);
app.post('/api/git/apply', git.applyPatches);
app.post('/api/term/propose', term.propose);
app.post('/api/term/approve', term.approve);

const PORT = process.env.PORT || 9000;
app.listen(PORT, ()=> console.log(`[lucidia-dev] server listening on :${PORT}`));
