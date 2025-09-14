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
import productIdeas from './routes/product/ideas.js';
import productPrd from './routes/product/prd.js';
import productRoadmap from './routes/product/roadmap.js';
import productReleases from './routes/product/releases.js';
import productFlags from './routes/product/flags.js';
import productFeedback from './routes/product/feedback.js';
import cpqCatalog from './routes/cpq/catalog.js';
import cpqPricing from './routes/cpq/pricing.js';
import cpqQuotes from './routes/cpq/quotes.js';
import cpqApprovals from './routes/cpq/approvals.js';
import cpqOrders from './routes/cpq/orders.js';
import cpqSubs from './routes/cpq/subscriptions.js';
import cpmDrivers from './routes/cpm/drivers.js';
import cpmForecast from './routes/cpm/forecast.js';
import cpmVariance from './routes/cpm/variance.js';
import cpmPacks from './routes/cpm/packs.js';
import soxRCM from './routes/sox/rcm.js';
import soxNarr from './routes/sox/narratives.js';
import soxTests from './routes/sox/tests.js';
import soxDef from './routes/sox/deficiency.js';
import soxSoD from './routes/sox/sod.js';
import soxScope from './routes/sox/scope.js';
import faPolicy from './routes/fa/policy.js';
import faAssets from './routes/fa/assets.js';
import faDepr from './routes/fa/depr.js';
import faGL from './routes/fa/gl.js';
import leaseContracts from './routes/leases/contracts.js';
import leaseSchedule from './routes/leases/schedule.js';
import leaseJournal from './routes/leases/journal.js';

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
app.use('/api/product', productIdeas, productPrd, productRoadmap, productReleases, productFlags, productFeedback);
app.use('/api/cpq', cpqCatalog, cpqPricing, cpqQuotes, cpqApprovals, cpqOrders, cpqSubs);
app.use('/api/cpm', cpmDrivers, cpmForecast, cpmVariance, cpmPacks);
app.use('/api/sox', soxRCM, soxNarr, soxTests, soxDef, soxSoD, soxScope);
app.use('/api/fa', faPolicy, faAssets, faDepr, faGL);
app.use('/api/leases', leaseContracts, leaseSchedule, leaseJournal);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
