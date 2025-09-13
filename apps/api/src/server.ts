import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import './lib/otel.js';
import { canaryMiddleware } from './middleware/canary.js';
import { orgResolver, requireOrg } from './middleware/org.js';
import { requireRole } from './middleware/rbac.js';
import orgCreate from './routes/orgs/create.js';
import orgInvite from './routes/orgs/invite.js';
import orgAccept from './routes/orgs/accept_invite.js';
import orgKeys from './routes/admin/org_apikeys.js';
import orgAudit from './routes/admin/auditlog.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(canaryMiddleware(Number(process.env.CANARY_PERCENT || 10)));
// resolve org from header or session
app.use(orgResolver());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

import hooks from './routes/hooks.js';
import metrics from './routes/metrics.js';
import okta from './routes/okta.js';
app.use('/api/hooks', hooks);
app.use('/api/metrics', metrics);
app.use('/api/auth/okta', okta);
// org lifecycle
app.use('/api/orgs/create', orgCreate);
app.use('/api/orgs/invite', requireOrg(), requireRole('admin'), orgInvite);
app.use('/api/orgs/accept-invite', orgAccept);

// per-org admin
app.use('/api/admin/org/keys', requireOrg(), requireRole('admin'), orgKeys);
app.use('/api/admin/org/audit', requireOrg(), requireRole('admin'), orgAudit);

const port = process.env.PORT || 4000;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`API listening on ${port}`));
}

export default app;
