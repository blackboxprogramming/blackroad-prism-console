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
import clmTemplates from './routes/clm/templates.js';
import clmContracts from './routes/clm/contracts.js';
import clmApprovals from './routes/clm/approvals.js';
import clmEsign from './routes/clm/esign.js';
import clmOblig from './routes/clm/obligations.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
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

// raw body for e-sign verification
app.use((req:any,res,next)=>{ if (req.url.startsWith('/api/clm/esign')) { const b:Buffer[]=[]; req.on('data',(c)=>b.push(c)); req.on('end',()=>{ req.rawBody = Buffer.concat(b).toString(); next(); }); } else next(); });

app.use('/api/clm', clmTemplates, clmContracts, clmApprovals, clmEsign, clmOblig);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
