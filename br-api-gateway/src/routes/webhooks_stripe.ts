import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { ssm } from '../util/ssm.js';
import { db } from '../util/db.js';

const stripe = new Stripe('sk_test_dummy', { apiVersion: '2024-06-20' });

function resolveEnv(req: any): string {
  return req?.env || process.env.APP_ENV || process.env.NODE_ENV || 'local';
}

function resolveSourceId(req: any): string | null {
  return req?.sourceId ?? null;
}

export default async function (app: FastifyInstance) {
  app.post('/webhooks/stripe', async (req: any, reply) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig) return reply.code(400).send({ error: 'missing signature' });

    const env = resolveEnv(req);
    const secretPath = `/blackroad/${env}/stripe/webhook_secret`;
    const secret = await ssm.get(secretPath);

    const rawBody = (req.rawBody ?? req.body) as Buffer | undefined;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      req.log.warn({ bodyType: typeof rawBody }, 'stripe webhook missing raw body');
      return reply.code(400).send({ error: 'bad payload' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err: any) {
      req.log.warn({ err }, 'stripe webhook verify failed');
      return reply.code(400).send({ error: 'bad signature' });
    }

    try {
      switch (event.type) {
        case 'invoice.paid': {
          const inv = event.data.object as Stripe.Invoice;
          if (inv.charge) {
            req.log.info({ invoice: inv.id, charge: inv.charge }, 'stripe invoice paid');
          }
          break;
        }

        case 'charge.succeeded':
        case 'charge.refunded':
        case 'charge.updated': {
          const c = event.data.object as Stripe.Charge;
          await db.query(
            `
            insert into raw_stripe_charges(id,customer_id,amount,currency,paid,status,created_at,refunded,payload,source_id)
            values ($1,$2,$3,$4,$5,$6,to_timestamp($7),$8,$9,$10)
            on conflict (id) do update set
              customer_id = excluded.customer_id,
              amount      = excluded.amount,
              currency    = excluded.currency,
              paid        = excluded.paid,
              status      = excluded.status,
              created_at  = excluded.created_at,
              refunded    = excluded.refunded,
              payload     = excluded.payload,
              source_id   = excluded.source_id
          `,
            [
              c.id,
              (c.customer as string) ?? null,
              c.amount,
              c.currency,
              c.paid,
              c.status,
              c.created,
              !!c.refunded,
              JSON.stringify(c),
              resolveSourceId(req)
            ]
          );
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const s = event.data.object as Stripe.Subscription;
          await db.query(
            `
            insert into raw_stripe_subscriptions(id,customer_id,status,current_period_start,current_period_end,canceled_at,cancel_at_period_end,created_at,payload,source_id)
            values ($1,$2,$3,to_timestamp($4),to_timestamp($5),to_timestamp($6),$7,to_timestamp($8),$9,$10)
            on conflict (id) do update set
              customer_id           = excluded.customer_id,
              status                = excluded.status,
              current_period_start  = excluded.current_period_start,
              current_period_end    = excluded.current_period_end,
              canceled_at           = excluded.canceled_at,
              cancel_at_period_end  = excluded.cancel_at_period_end,
              created_at            = excluded.created_at,
              payload               = excluded.payload,
              source_id             = excluded.source_id
          `,
            [
              s.id,
              s.customer as string,
              s.status,
              s.current_period_start || null,
              s.current_period_end || null,
              s.canceled_at || null,
              !!s.cancel_at_period_end,
              s.created,
              JSON.stringify(s),
              resolveSourceId(req)
            ]
          );

          const items = s.items?.data ?? [];
          if (items.length) {
            const values: unknown[] = [];
            const rows = items
              .map((it, i) => {
                const offset = i * 10;
                values.push(
                  it.id,
                  s.id,
                  it.price?.id,
                  it.price?.currency || 'usd',
                  it.price?.recurring?.interval || 'month',
                  it.price?.recurring?.interval_count || 1,
                  it.price?.unit_amount ?? null,
                  it.quantity ?? 1,
                  JSON.stringify(it),
                  resolveSourceId(req)
                );
                return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10})`;
              })
              .join(',');

            await db.query(
              `
              insert into raw_stripe_subscription_items(id,subscription_id,price_id,currency,interval,interval_count,unit_amount,quantity,payload,source_id)
              values ${rows}
              on conflict (id) do update set
                subscription_id=excluded.subscription_id,
                price_id=excluded.price_id,
                currency=excluded.currency,
                interval=excluded.interval,
                interval_count=excluded.interval_count,
                unit_amount=excluded.unit_amount,
                quantity=excluded.quantity,
                payload=excluded.payload,
                source_id=excluded.source_id
            `,
              values
            );
          }
          break;
        }

        default:
          req.log.debug({ type: event.type }, 'stripe webhook ignored');
          break;
      }

      return reply.code(200).send({ ok: true });
    } catch (err: any) {
      req.log.error({ err, type: event.type }, 'webhook handler error');
      return reply.code(500).send({ error: 'handler error' });
    }
  });
}
