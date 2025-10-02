import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { mkToken } from '../../lib/oauth.js';
const r = Router();

r.get('/authorize', async (req:any,res)=>{
  const { client_id, redirect_uri, scope, state } = req.query as any;
  const app = await prisma.partnerApp.findFirst({ where:{ clientId: String(client_id) }});
  if (!app || !app.approved) return res.status(400).send('invalid_client');
  // derive org from authenticated context; deny if missing to avoid cross-tenant leaks
  const orgId = req.org?.id || req.user?.orgId || req.auth?.orgId || req.session?.orgId;
  if (!orgId) return res.status(400).send('missing_org');
  // naive consent: auto-consent for demo; real app would render a consent page
  const code = mkToken({ appId: app.id, orgId, scope }, process.env.OAUTH_SIGNING_SECRET);
  const url = new URL(String(redirect_uri)); url.searchParams.set('code', code); if (state) url.searchParams.set('state', state);
  res.redirect(url.toString());
});

export default r;
