import { PoolClient } from 'pg';
import { StripeCharge, StripeSubscription, StripeSubscriptionItem } from './types.js';

type GetItemsFn = (token: string, subscriptionId: string) => Promise<StripeSubscriptionItem[]>;

export async function upsertCharges(client: PoolClient, items: StripeCharge[], sourceId: string) {
  if (!items.length) return 0;
  const values: any[] = [];
  const rows = items
    .map((charge, idx) => {
      const base = idx * 10;
      values.push(
        charge.id,
        charge.customer ?? null,
        charge.amount,
        charge.currency,
        charge.paid,
        charge.status,
        new Date(charge.created * 1000).toISOString(),
        charge.refunded ?? false,
        JSON.stringify(charge),
        sourceId
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`;
    })
    .join(',');
  await client.query(
    `INSERT INTO raw_stripe_charges(id, customer_id, amount, currency, paid, status, created_at, refunded, payload, source_id)
     VALUES ${rows}
     ON CONFLICT (id) DO UPDATE SET
       customer_id = EXCLUDED.customer_id,
       amount = EXCLUDED.amount,
       currency = EXCLUDED.currency,
       paid = EXCLUDED.paid,
       status = EXCLUDED.status,
       created_at = EXCLUDED.created_at,
       refunded = EXCLUDED.refunded,
       payload = EXCLUDED.payload,
       source_id = EXCLUDED.source_id`,
    values
  );
  return items.length;
}

export async function upsertSubscriptions(
  client: PoolClient,
  subs: StripeSubscription[],
  token: string,
  sourceId: string,
  getItems: GetItemsFn
) {
  let count = 0;
  for (const sub of subs) {
    await client.query(
      `INSERT INTO raw_stripe_subscriptions(
         id, customer_id, status, current_period_start, current_period_end,
         canceled_at, cancel_at_period_end, created_at, payload, source_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         status = EXCLUDED.status,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         canceled_at = EXCLUDED.canceled_at,
         cancel_at_period_end = EXCLUDED.cancel_at_period_end,
         created_at = EXCLUDED.created_at,
         payload = EXCLUDED.payload,
         source_id = EXCLUDED.source_id`,
      [
        sub.id,
        sub.customer,
        sub.status,
        sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
        sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        Boolean(sub.cancel_at_period_end),
        new Date(sub.created * 1000).toISOString(),
        JSON.stringify(sub),
        sourceId,
      ]
    );
    const items = await getItems(token, sub.id);
    if (items.length) {
      const vals: any[] = [];
      const rows = items
        .map((item, idx) => {
          const base = idx * 10;
          vals.push(
            item.id,
            sub.id,
            item.price?.id ?? 'unknown',
            item.price?.currency ?? 'usd',
            item.price?.recurring?.interval ?? 'month',
            item.price?.recurring?.interval_count ?? 1,
            item.price?.unit_amount ?? null,
            item.quantity ?? 1,
            JSON.stringify(item),
            sourceId
          );
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`;
        })
        .join(',');
      await client.query(
        `INSERT INTO raw_stripe_subscription_items(
           id, subscription_id, price_id, currency, interval, interval_count,
           unit_amount, quantity, payload, source_id
         )
         VALUES ${rows}
         ON CONFLICT (id) DO UPDATE SET
           subscription_id = EXCLUDED.subscription_id,
           price_id = EXCLUDED.price_id,
           currency = EXCLUDED.currency,
           interval = EXCLUDED.interval,
           interval_count = EXCLUDED.interval_count,
           unit_amount = EXCLUDED.unit_amount,
           quantity = EXCLUDED.quantity,
           payload = EXCLUDED.payload,
           source_id = EXCLUDED.source_id`,
        vals
      );
    }
    count += 1;
  }
  return count;
}
