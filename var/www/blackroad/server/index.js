const express = require('express');
const cors = require('cors');
const ai = require('./routes/ai');
const agent = require('./routes/agent');
const gitRouter = require('./routes/git');
const term = require('./routes/term');
const billing = require('./routes/billing');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/ai/complete', ai.streamComplete); // SSE
app.post('/api/agent/task', agent.runTask);
app.use('/api/git', gitRouter);
app.post('/api/term/propose', term.propose);
app.post('/api/term/approve', term.approve);
app.get('/api/billing', billing.getBilling);

const PORT = process.env.PORT || 9000;
app.listen(
  PORT,
  '0.0.0.0',
  () => console.log(`[lucidia-dev] server listening on 0.0.0.0:${PORT}`)
);
