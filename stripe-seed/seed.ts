import 'dotenv/config';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_KEY;
if (!stripeKey) {
  console.error('Missing STRIPE_KEY in environment.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
const currency = process.env.CURRENCY || 'usd';

async function main() {
  const prod = await stripe.products.create({ name: 'BlackRoad PRISM' });
  const monthly = await stripe.prices.create({
    unit_amount: 4900,
    currency,
    recurring: { interval: 'month' },
    product: prod.id
  });
  const yearly = await stripe.prices.create({
    unit_amount: 49000,
    currency,
    recurring: { interval: 'year' },
    product: prod.id
  });

  const alice = await stripe.customers.create({
    email: 'alice@example.com',
    name: 'Alice Example'
  });
  const bob = await stripe.customers.create({
    email: 'bob@example.com',
    name: 'Bob Example'
  });

  await stripe.subscriptions.create({
    customer: alice.id,
    items: [{ price: monthly.id, quantity: 3 }],
    trial_period_days: 7
  });
  const activeSub = await stripe.subscriptions.create({
    customer: bob.id,
    items: [{ price: yearly.id }]
  });

  const charges = [
    { customer: alice.id, amount: 990, descr: 'Add-on credit' },
    { customer: bob.id, amount: 1299, descr: 'One-off support' },
    { customer: bob.id, amount: 4900, descr: 'Monthly top-up' }
  ];

  const extraAmount = Number(process.env.AMOUNT || '0');
  if (!Number.isNaN(extraAmount) && extraAmount > 0) {
    charges.push({ customer: bob.id, amount: extraAmount, descr: 'Workflow-dispatched charge' });
  }

  for (const ch of charges) {
    await stripe.charges.create({
      amount: ch.amount,
      currency,
      customer: ch.customer,
      description: ch.descr,
      source: 'tok_visa'
    });
  }

  console.log('Seeded: product/prices, 2 customers, 2 subs, 3 charges.');
  console.log(`Product: ${prod.id} | Monthly: ${monthly.id} | Yearly: ${yearly.id}`);
  console.log(`Customers: ${alice.email}, ${bob.email}`);
  console.log(`Active sub: ${activeSub.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
