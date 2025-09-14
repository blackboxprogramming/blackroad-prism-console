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
import p2pV from './routes/p2p/vendors.js';
import p2pI from './routes/p2p/items.js';
import p2pReq from './routes/p2p/req.js';
import p2pPO from './routes/p2p/po.js';
import p2pRec from './routes/p2p/receipts.js';
import p2pAP from './routes/p2p/ap.js';
import p2pPol from './routes/p2p/policy.js';
import expRep from './routes/expenses/reports.js';
import expCard from './routes/expenses/cards.js';
import prEmp from './routes/payroll/employees.js';
import prSched from './routes/payroll/schedule.js';
import prTime from './routes/payroll/time.js';
import prRun from './routes/payroll/run.js';
import prForms from './routes/payroll/forms.js';
import p2pPay from './routes/p2p/payments.js';
import foProv from './routes/finops/providers.js';
import foCost from './routes/finops/cost.js';
import foAlloc from './routes/finops/allocation.js';
import foBud from './routes/finops/budgets.js';
import foAnom from './routes/finops/anomaly.js';
import foRecs from './routes/finops/recs.js';
import foUnit from './routes/finops/unit.js';
import cmdbCI from './routes/cmdb/ci.js';
import cmdbBase from './routes/cmdb/baseline.js';
import changeCRQ from './routes/change/crq.js';
import changeCal from './routes/change/calendar.js';
import relRel from './routes/release/rel.js';
import patchV from './routes/patch/vuln.js';
import patchP from './routes/patch/plan.js';
import lic from './routes/cmdb/license.js';
import iamIdp from './routes/iam/idp.js';
import iamDir from './routes/iam/directory.js';
import iamPol from './routes/iam/policies.js';
import iamPdp from './routes/iam/pdp.js';
import iamScim from './routes/iam/scim.js';
import iamAccess from './routes/iam/access.js';
import iamTokens from './routes/iam/tokens.js';
import iamSecrets from './routes/iam/secrets.js';
import iamDevices from './routes/iam/devices.js';
import clmT from './routes/clm/templates.js';
import clmC from './routes/clm/clauses.js';
import clmR from './routes/clm/requests.js';
import clmCt from './routes/clm/contracts.js';
import clmEs from './routes/clm/esign.js';
import clmAp from './routes/clm/approvals.js';
import clmOb from './routes/clm/oblig.js';
import clmRepo from './routes/clm/repo.js';

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
app.use('/api/p2p', p2pV, p2pI, p2pReq, p2pPO, p2pRec, p2pAP, p2pPol, p2pPay);
app.use('/api/expenses', expRep, expCard);
app.use('/api/payroll', prEmp, prSched, prTime, prRun, prForms);
app.use('/api/finops', foProv, foCost, foAlloc, foBud, foAnom, foRecs, foUnit);
app.use('/api/cmdb', cmdbCI, cmdbBase, lic);
app.use('/api/change', changeCRQ, changeCal);
app.use('/api/release', relRel);
app.use('/api/patch', patchV, patchP);
app.use('/api/iam', iamIdp, iamDir, iamPol, iamPdp, iamScim, iamAccess, iamTokens, iamSecrets, iamDevices);
app.use('/api/clm', clmT, clmC, clmR, clmCt, clmEs, clmAp, clmOb, clmRepo);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
