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
import hrOnOff from './routes/hr/onoff.js';
import hrOrg from './routes/hr/org.js';
import hrPto from './routes/hr/pto.js';
import hrReviews from './routes/hr/reviews.js';
import hrTraining from './routes/hr/training.js';
import hrPolicies from './routes/hr/policies.js';
import adminAccess from './routes/admin/access_review.js';
import adminLic from './routes/admin/licensing.js';
import adminDev from './routes/admin/devices.js';
import adminVend from './routes/admin/vendors.js';
import adminPO from './routes/admin/procurement.js';
import mktSegments from './routes/mkt/segments.js';
import mktCampaigns from './routes/mkt/campaigns.js';
import mktJourneys from './routes/mkt/journeys.js';
import mktTemplates from './routes/mkt/templates.js';
import mktScore from './routes/mkt/score.js';
import mktUtm from './routes/mkt/utm.js';
import supTickets from './routes/support/tickets.js';
import supSla from './routes/support/sla.js';
import supMacros from './routes/support/macros.js';
import supKb from './routes/support/kb.js';
import supChat from './routes/support/chat.js';
import productIdeas from './routes/product/ideas.js';
import productPrd from './routes/product/prd.js';
import productRoadmap from './routes/product/roadmap.js';
import productReleases from './routes/product/releases.js';
import productFeedback from './routes/product/feedback.js';
import aiPrompts from './routes/ai/prompts.js';
import aiTools from './routes/ai/tools.js';
import aiRag from './routes/ai/rag.js';
import aiAssist from './routes/ai/assistants.js';
import aiEvals from './routes/ai/evals.js';
import aiExps from './routes/ai/experiments.js';
import aiSafety from './routes/ai/safety.js';
import aiRun from './routes/ai/run.js';
import cookieParser from 'cookie-parser';
import { assignExperiment } from './middleware/experiment.js';
import agentsCommand from './routes/agents/command.js';
import agentsSlack from './routes/agents/slack.js';
import agentsDiscord from './routes/agents/discord.js';
import supEmail from './routes/support/email.js';
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
import csWeights from './routes/cs/weights.js';
import csSignals from './routes/cs/signals.js';
import csHealth from './routes/cs/health.js';
import csPlay from './routes/cs/playbooks.js';
import csOnb from './routes/cs/onboarding.js';
import csQbr from './routes/cs/qbr.js';
import csAlerts from './routes/cs/alerts.js';
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
import ds from './routes/aiops/datasets.js';
import ft from './routes/aiops/features.js';
import ex from './routes/aiops/experiments.js';
import tr from './routes/aiops/training.js';
import md from './routes/aiops/models.js';
import mrm from './routes/aiops/mrm.js';
import dep from './routes/aiops/deploy.js';
import mon from './routes/aiops/monitor.js';
import devApis from './routes/dev/apis.js';
import devKeys from './routes/dev/keys_oauth.js';
import devPlans from './routes/dev/plans.js';
import devGW from './routes/dev/gateway.js';
import devHooks from './routes/dev/webhooks.js';
import devDocs from './routes/dev/docs.js';
import devAnalytics from './routes/dev/analytics.js';
import tprmV from './routes/tprm/vendors.js';
import tprmQ from './routes/tprm/questionnaires.js';
import tprmR from './routes/tprm/risk_issues.js';
import tprmM from './routes/tprm/monitor_sla.js';
import tprmMap from './routes/tprm/mapping.js';
import tprmB from './routes/tprm/breach.js';
import portalAnn from './routes/portal/announcements.js';
import portalCh from './routes/portal/channels.js';
import portalPrefs from './routes/portal/prefs_acks.js';
import portalBan from './routes/portal/banners.js';
import portalI18n from './routes/portal/i18n.js';
import portalSearch from './routes/portal/search.js';
import atsJC from './routes/ats/jobs_candidates.js';
import atsAPP from './routes/ats/applications.js';
import atsINT from './routes/ats/interviews.js';
import atsOF from './routes/ats/offers_bg.js';
import atsOB from './routes/ats/onboarding.js';
import atsAR from './routes/ats/analytics_reports.js';
import bcdrPolicy from './routes/bcdr/policy.js';
import bcdrBackups from './routes/bcdr/backups.js';
import bcdrRestore from './routes/bcdr/restore.js';
import bcdrFailover from './routes/bcdr/failover.js';
import bcdrPlans from './routes/bcdr/plans.js';
import bcdrDrills from './routes/bcdr/drills.js';
import arInvoice from './routes/ar/invoice.js';
import arPayment from './routes/ar/payment.js';
import arCash from './routes/ar/cashapp.js';
import arCredit from './routes/ar/credit.js';
import arDunning from './routes/ar/dunning.js';
import arDispute from './routes/ar/dispute.js';
import arLockbox from './routes/ar/lockbox.js';
import { apiKeyAuth } from './middleware/api_key.js';
import { rateLimit } from './middleware/rate_limit.js';
import { cookieParser, requireSession } from './middleware/session.js';
import adminKeys from './routes/admin/keys.js';
import adminWebhooks from './routes/admin/webhooks.js';
import deliver from './routes/webhooks/deliver.js';
import ping from './routes/public/ping.js';
import facLS from './routes/fac/locations_spaces.js';
import facBK from './routes/fac/bookings.js';
import facVB from './routes/fac/visitors_badges.js';
import facAM from './routes/fac/assets_maint.js';
import facEHS from './routes/fac/ehs.js';
import clmT from './routes/clm/templates.js';
import clmC from './routes/clm/clauses.js';
import clmR from './routes/clm/requests.js';
import clmCt from './routes/clm/contracts.js';
import clmEs from './routes/clm/esign.js';
import clmAp from './routes/clm/approvals.js';
import clmOb from './routes/clm/oblig.js';
import clmRepo from './routes/clm/repo.js';
import costItems from './routes/cost/items.js';
import costRoll from './routes/cost/rollup.js';
import invTxn from './routes/inv/txn.js';
import costMO from './routes/cost/mo.js';
import costVar from './routes/cost/variance.js';
import invCount from './routes/inv/count.js';
import costGL from './routes/cost/gl.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Capture the raw Slack payload before body parsers consume the stream so signature checks work.
app.use((req: any, _res, next) => {
  if (req.url.startsWith('/api/agents/slack')) {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      req.rawBody = Buffer.concat(chunks).toString();
      next();
    });
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));
app.use(regionMiddleware());
app.use(localeMiddleware());
app.use(cookieParser());
app.use(assignExperiment(['A','B']));

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
app.use('/api/hr', hrOnOff, hrOrg, hrPto, hrReviews, hrTraining, hrPolicies);

// raw body for e-sign verification
app.use((req:any,res,next)=>{ if (req.url.startsWith('/api/clm/esign')) { const b:Buffer[]=[]; req.on('data',(c)=>b.push(c)); req.on('end',()=>{ req.rawBody = Buffer.concat(b).toString(); next(); }); } else next(); });

app.use(express.json());

app.use('/api/clm', clmTemplates, clmContracts, clmApprovals, clmEsign, clmOblig);
app.use('/api/admin', adminAccess, adminLic, adminDev, adminVend, adminPO);
app.use('/api/mkt', mktSegments, mktCampaigns, mktJourneys, mktTemplates, mktScore, mktUtm);
app.use('/api/support', supTickets, supSla, supMacros, supKb, supChat, supEmail);
app.use('/api/product', productIdeas, productPrd, productRoadmap, productReleases, productFeedback);
app.use('/api/ai', aiPrompts, aiTools, aiRag, aiAssist, aiEvals, aiExps, aiSafety, aiRun);
import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import okta from './routes/okta.js';
import predict from './routes/predict.js';
import reco from './routes/reco.js';
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);
app.use('/api/ml/predict', predict);
app.use('/api/reco', reco);

app.use('/api/agents/command', agentsCommand);
app.use('/api/agents/slack', agentsSlack);
app.use('/api/agents/discord', agentsDiscord);
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
app.use('/api/aiops', ds, ft, ex, tr, md, mrm, dep, mon);
import agentsCommand from './routes/agents/command.js';
import agentsSlack from './routes/agents/slack.js';
import agentsDiscord from './routes/agents/discord.js';
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);
app.use('/api/agents/command', agentsCommand);
app.use('/api/agents/slack', agentsSlack);
app.use('/api/agents/discord', agentsDiscord);
app.use('/api/iam', iamIdp, iamDir, iamPol, iamPdp, iamScim, iamAccess, iamTokens, iamSecrets, iamDevices);
app.use('/api/aiops', ds, ft, ex, tr, md, mrm, dep, mon);
app.use('/api/dev', devApis, devKeys, devPlans, devGW, devHooks, devDocs, devAnalytics);
app.use('/api/tprm', tprmV, tprmQ, tprmR, tprmM, tprmMap, tprmB);
app.use('/api/portal', portalAnn, portalCh, portalPrefs, portalBan, portalI18n, portalSearch);
app.use('/api/ats', atsJC, atsAPP, atsINT, atsOF, atsOB, atsAR);
app.use('/api/bcdr', bcdrPolicy, bcdrBackups, bcdrRestore, bcdrFailover, bcdrPlans, bcdrDrills);
app.use('/api/ar', arInvoice, arPayment, arCash, arCredit, arDunning, arDispute, arLockbox);

// Public
app.use('/api/public/ping', ping);

const adminGuard = requireSession();
app.use('/api/admin/keys', adminGuard, adminKeys);
app.use('/api/admin/webhooks', adminGuard, adminWebhooks);

// Partner (API key + limit)
app.use('/api/partner', apiKeyAuth(), rateLimit(), deliver);
app.use('/api/fac', facLS, facBK, facVB, facAM, facEHS);
app.use('/api/clm', clmT, clmC, clmR, clmCt, clmEs, clmAp, clmOb, clmRepo);
app.use('/api/cost', costItems, costRoll, costMO, costVar, costGL);
app.use('/api/inv', invTxn, invCount);
app.use('/api/cpq', cpqCatalog, cpqPricing, cpqQuotes, cpqApprovals, cpqOrders, cpqSubs);
app.use('/api/cs', csWeights, csSignals, csHealth, csPlay, csOnb, csQbr, csAlerts);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
