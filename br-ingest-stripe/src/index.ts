import 'dotenv/config';
import { pool } from './pg.js';
import { getSecureParameter } from './ssm.js';
import { listCharges, listSubscriptions, getSubscriptionItems } from './stripe.js';
import { upsertCharges, upsertSubscriptions } from './upsert.js';

async function main() {
  const sourceId = process.env.SOURCE_ID;
  const tokenParam = process.env.STRIPE_TOKEN_PARAM;
  if (!sourceId) {
    throw new Error('SOURCE_ID is required');
  }
  if (!tokenParam) {
    throw new Error('STRIPE_TOKEN_PARAM is required');
  }

  const token = await getSecureParameter(tokenParam);
  if (!token) {
    throw new Error('Stripe token empty');
  }

  const client = await pool.connect();
  try {
    const state = await client.query<{ last_charge_ts: Date | null; last_sub_updated_ts: Date | null }>(
      `SELECT last_charge_ts, last_sub_updated_ts FROM stripe_sync_state WHERE source_id = $1`,
      [sourceId]
    );
    const lastChargeTs = state.rows[0]?.last_charge_ts ? new Date(state.rows[0].last_charge_ts) : new Date(0);
    const lastSubTs = state.rows[0]?.last_sub_updated_ts ? new Date(state.rows[0].last_sub_updated_ts) : new Date(0);

    let chargesCount = 0;
    let latestChargeTs = lastChargeTs;
    const createdGte = Math.floor(lastChargeTs.getTime() / 1000);
    for await (const page of listCharges(token, { created: { gte: createdGte } })) {
      if (!Array.isArray(page) || page.length === 0) continue;
      chargesCount += await upsertCharges(client, page, sourceId);
      const maxCreated = page.reduce((max: number, charge: any) => Math.max(max, Number(charge?.created ?? 0)), 0);
      if (maxCreated) {
        const createdAt = new Date(maxCreated * 1000);
        if (createdAt > latestChargeTs) {
          latestChargeTs = createdAt;
        }
      }
    }

    let subsCount = 0;
    let latestSubUpdated = lastSubTs;
    const updatedGte = Math.floor(lastSubTs.getTime() / 1000);
    for await (const page of listSubscriptions(token, { updated: { gte: updatedGte } })) {
      if (!Array.isArray(page) || page.length === 0) continue;
      subsCount += await upsertSubscriptions(client, page, token, sourceId, getSubscriptionItems);
      const pageMax = page.reduce((max: number, sub: any) => {
        const ts = Number(sub?.updated ?? sub?.current_period_end ?? sub?.created ?? 0);
        return Math.max(max, ts);
      }, 0);
      if (pageMax) {
        const subDate = new Date(pageMax * 1000);
        if (subDate > latestSubUpdated) {
          latestSubUpdated = subDate;
        }
      }
    }

    const nextChargeTs = chargesCount > 0 ? latestChargeTs : lastChargeTs;
    const nextSubTs = subsCount > 0 ? latestSubUpdated : lastSubTs;

    await client.query(
      `INSERT INTO stripe_sync_state(source_id, last_charge_ts, last_sub_updated_ts)
       VALUES ($1, $2, $3)
       ON CONFLICT (source_id) DO UPDATE SET last_charge_ts = $2, last_sub_updated_ts = $3`,
      [sourceId, nextChargeTs.toISOString(), nextSubTs.toISOString()]
    );

    console.log(`Stripe ingest complete: charges +${chargesCount}, subs +${subsCount}`);
  } finally {
    client.release();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
