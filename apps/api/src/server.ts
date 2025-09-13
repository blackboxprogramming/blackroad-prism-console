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
import adminAccess from './routes/admin/access_review.js';
import adminLic from './routes/admin/licensing.js';
import adminDev from './routes/admin/devices.js';
import adminVend from './routes/admin/vendors.js';
import adminPO from './routes/admin/procurement.js';
import supTickets from './routes/support/tickets.js';
import supSla from './routes/support/sla.js';
import supMacros from './routes/support/macros.js';
import supKb from './routes/support/kb.js';
import supChat from './routes/support/chat.js';
import supEmail from './routes/support/email.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));
app.use(regionMiddleware());
app.use(localeMiddleware());

// raw body for email signature verification
app.use((req:any,res,next)=>{ if (req.url.startsWith('/api/support/email/ingest')) { const b:Buffer[]=[]; req.on('data',(c)=>b.push(c)); req.on('end',()=>{ req.rawBody = Buffer.concat(b).toString(); next(); }); } else next(); });

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
app.use('/api/admin', adminAccess, adminLic, adminDev, adminVend, adminPO);
app.use('/api/support', supTickets, supSla, supMacros, supKb, supChat, supEmail);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
