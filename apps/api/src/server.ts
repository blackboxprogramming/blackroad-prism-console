import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import './lib/otel.js';
import { canaryMiddleware } from './middleware/canary.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import okta from './routes/okta.js';
import agentsCommand from './routes/agents/command.js';
import agentsSlack from './routes/agents/slack.js';
import agentsDiscord from './routes/agents/discord.js';
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);
// raw body for Slack signature
app.use((req:any,res,next)=>{ if (req.url.startsWith('/api/agents/slack')) { const b:Buffer[]=[]; req.on('data',(c)=>b.push(c)); req.on('end',()=>{ req.rawBody = Buffer.concat(b).toString(); next(); }); } else next(); });
app.use('/api/agents/command', agentsCommand);
app.use('/api/agents/slack', agentsSlack);
app.use('/api/agents/discord', agentsDiscord);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
