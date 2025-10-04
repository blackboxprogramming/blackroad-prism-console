import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../lib/db.js';
import { putSecureParameter } from '../lib/ssm.js';
import { triggerStripeIngest } from '../lib/ecs.js';

interface StripeAccountResponse {
  id: string;
  email?: string;
  business_profile?: { name?: string };
  settings?: { dashboard?: { display_name?: string } };
}

const router = Router();

async function validateStripeToken(token: string): Promise<StripeAccountResponse> {
  const resp = await fetch('https://api.stripe.com/v1/accounts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`stripe_auth_failed:${resp.status}:${text}`);
  }
  return (await resp.json()) as StripeAccountResponse;
}

function envPrefix() {
  const raw = process.env.APP_ENV || process.env.NODE_ENV || 'dev';
  return raw.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'dev';
}

router.post('/', async (req, res) => {
  try {
    const { kind, token } = req.body ?? {};
    if (kind !== 'stripe') {
      return res.status(400).json({ error: 'unsupported_kind' });
    }
    if (typeof token !== 'string' || !token.startsWith('sk_')) {
      return res.status(400).json({ error: 'invalid_token' });
    }

    const account = await validateStripeToken(token);
    if (!account?.id) {
      throw new Error('stripe_account_missing');
    }

    const sourceId = randomUUID();
    const label =
      account.settings?.dashboard?.display_name ||
      account.business_profile?.name ||
      account.email ||
      `Stripe ${account.id}`;

    await query(
      `INSERT INTO integration_sources(id, kind, label)
       VALUES ($1, $2, $3)`,
      [sourceId, 'stripe', label]
    );

    await query(
      `INSERT INTO stripe_sync_state(source_id)
       VALUES ($1)
       ON CONFLICT (source_id) DO NOTHING`,
      [sourceId]
    );

    const paramName = `/blackroad/${envPrefix()}/sources/${sourceId}/stripe_token`;
    await putSecureParameter(paramName, token);

    let ingestTriggered = false;
    try {
      const result = await triggerStripeIngest({ sourceId, tokenParameter: paramName });
      ingestTriggered = result.triggered;
    } catch (err) {
      console.error('stripe_ingest_trigger_failed', err);
    }

    res.status(201).json({
      sourceId,
      kind: 'stripe',
      accountId: account.id,
      label,
      ingestTriggered,
      tokenParameter: paramName,
    });
  } catch (err: any) {
    if (typeof err?.message === 'string' && err.message.startsWith('stripe_auth_failed')) {
      return res.status(401).json({ error: 'stripe_auth_failed' });
    }
    console.error('create_source_error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
