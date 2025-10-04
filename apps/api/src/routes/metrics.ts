import { Router } from 'express';
import { query } from '../lib/db.js';

const router = Router();

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RangeResult {
  from: Date;
  to: Date;
}

function parseIso(value: string, field: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`invalid_${field}`);
  }
  return d;
}

function parseRelative(value: string, to: Date): Date {
  const match = /^-P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/i.exec(value);
  if (!match) {
    throw new Error('invalid_from');
  }
  const [, y, m, w, d] = match;
  const days =
    (y ? Number(y) * 365 : 0) +
    (m ? Number(m) * 30 : 0) +
    (w ? Number(w) * 7 : 0) +
    (d ? Number(d) : 0);
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(to.getTime() - ms);
}

function range(queryParams: Record<string, any>): RangeResult {
  const now = new Date();
  const toRaw = typeof queryParams.to === 'string' ? queryParams.to : undefined;
  const fromRaw = typeof queryParams.from === 'string' ? queryParams.from : undefined;
  const to = toRaw ? parseIso(toRaw, 'to') : now;
  let from: Date;
  if (fromRaw) {
    from = fromRaw.startsWith('-P') ? parseRelative(fromRaw, to) : parseIso(fromRaw, 'from');
  } else {
    from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (from > to) {
    throw new Error('invalid_range');
  }
  return { from, to };
}

router.get('/', (_req, res) => {
  res.json({ uptime: process.uptime(), ts: Date.now() });
});

router.get('/events', (_req, res) => {
  res.json([]);
});

router.get('/errors', (_req, res) => {
  res.json([]);
});

router.get('/stripe/charges', async (req, res) => {
  try {
    const { from, to } = range(req.query as Record<string, any>);
    const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;
    if (sourceId && !uuidPattern.test(sourceId)) {
      return res.status(400).json({ error: 'invalid_source_id' });
    }
    const params: any[] = sourceId ? [sourceId, from.toISOString(), to.toISOString()] : [from.toISOString(), to.toISOString()];
    const whereSource = sourceId ? 'AND source_id = $1' : '';
    const offset = sourceId ? 1 : 0;
    const { rows } = await query<{ d: string; amt_cents: string | number }>(
      `SELECT date_trunc('day', created_at) AS d, SUM(amount) AS amt_cents
       FROM raw_stripe_charges
       WHERE paid = TRUE AND refunded = FALSE AND created_at BETWEEN $${offset + 1} AND $${offset + 2}
         ${whereSource}
       GROUP BY 1
       ORDER BY 1 ASC`,
      params
    );
    res.json(
      rows.map((row) => ({
        t: new Date(row.d).toISOString(),
        v: Number(row.amt_cents) / 100,
      }))
    );
  } catch (err: any) {
    if (err?.message && err.message.startsWith('invalid_')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('stripe_charges_error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/stripe/active_subs', async (req, res) => {
  try {
    const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;
    if (sourceId && !uuidPattern.test(sourceId)) {
      return res.status(400).json({ error: 'invalid_source_id' });
    }
    const params: any[] = sourceId ? [sourceId] : [];
    const whereSource = sourceId ? 'AND source_id = $1' : '';
    const { rows } = await query<{ c: string }>(
      `SELECT COUNT(*) AS c
       FROM raw_stripe_subscriptions
       WHERE status IN ('active', 'trialing', 'past_due') ${whereSource}`,
      params
    );
    res.json([
      {
        t: new Date().toISOString(),
        v: Number(rows[0]?.c ?? 0),
      },
    ]);
  } catch (err) {
    console.error('stripe_active_subs_error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/stripe/mrr', async (req, res) => {
  try {
    const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;
    if (sourceId && !uuidPattern.test(sourceId)) {
      return res.status(400).json({ error: 'invalid_source_id' });
    }
    const params: any[] = sourceId ? [sourceId] : [];
    const whereSource = sourceId ? 'AND si.source_id = $1' : '';
    const { rows } = await query<{ mrr_cents: string | number | null }>(
      `SELECT COALESCE(SUM(
          CASE
            WHEN interval = 'month' THEN unit_amount * COALESCE(quantity, 1)
            WHEN interval = 'year' THEN (unit_amount * COALESCE(quantity, 1)) / 12.0
            WHEN interval = 'week' THEN (unit_amount * COALESCE(quantity, 1)) * 4.345
            WHEN interval = 'day' THEN (unit_amount * COALESCE(quantity, 1)) * 30.437
            ELSE 0
          END
        ), 0) AS mrr_cents
       FROM raw_stripe_subscription_items si
       JOIN raw_stripe_subscriptions s ON s.id = si.subscription_id
       WHERE s.status IN ('active', 'trialing', 'past_due') ${whereSource}`,
      params
    );
    const cents = Number(rows[0]?.mrr_cents ?? 0);
    res.json([
      {
        t: new Date().toISOString(),
        v: Math.round(cents) / 100,
      },
    ]);
  } catch (err) {
    console.error('stripe_mrr_error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
