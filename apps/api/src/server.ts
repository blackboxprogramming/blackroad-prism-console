import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import './lib/otel.js';
import { canaryMiddleware } from './middleware/canary.js';
import { regionMiddleware } from './middleware/region.js';
import { cacheHeaders } from './middleware/cache_headers.js';
import { localeMiddleware } from './middleware/locale.js';
import reindex from './routes/search/reindex.js';
import query from './routes/search/query.js';
import notifySend from './routes/notify/send.js';
import webpush from './routes/notify/webpush.js';
import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import okta from './routes/okta.js';
import agentsCommand from './routes/agents/command.js';
import agentsSlack from './routes/agents/slack.js';
import agentsDiscord from './routes/agents/discord.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const urlencodedParser = express.urlencoded({ extended: true });
app.use((req: any, res, next) => {
  if (req.originalUrl.startsWith('/api/agents/slack')) {
    return express.urlencoded({
      extended: true,
      verify: (slackReq: any, _res, buf) => {
        slackReq.rawBody = buf.toString();
      },
    })(req, res, next);
  }
  return urlencodedParser(req, res, next);
});

app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));
app.use(regionMiddleware());
app.use(localeMiddleware());

app.get('/api/health', cacheHeaders('health'), (_req,res)=> res.json({ ok:true, ts: Date.now() }));

// Search
app.post('/api/search/reindex', reindex);
app.get('/api/search', cacheHeaders('search'), query);

// Notifications
app.use('/api/notify', notifySend);
app.use('/api/notify/webpush', webpush);

app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);

app.use('/api/agents/command', agentsCommand);
app.use('/api/agents/slack', agentsSlack);
app.use('/api/agents/discord', agentsDiscord);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
