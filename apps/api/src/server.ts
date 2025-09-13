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
import samlMeta from './routes/saml/metadata.js';
import samlAcs from './routes/saml/acs.js';
import samlSlo from './routes/saml/slo.js';
import scimUsers from './routes/scim/users.js';
import scimGroups from './routes/scim/groups.js';
import { dlpRedact } from './middleware/dlp.js';
import edrHold from './routes/edr/legal_hold.js';
import edrExport from './routes/edr/export_audit.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));
app.use(regionMiddleware());
app.use(localeMiddleware());
// DLP must run early for inbound JSON
app.use(dlpRedact());

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

// SAML
app.use('/saml', samlMeta, samlAcs, samlSlo);

// SCIM
app.use('/scim/v2', scimUsers);
app.use('/scim/v2', scimGroups);

// eDiscovery / legal hold (admin scope in real deployment)
app.use('/api/edr', edrHold, edrExport);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
