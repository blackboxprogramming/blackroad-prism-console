# Stripe Test-Mode Seeder

Quickly create a seeded set of products, prices, customers, subscriptions, and historical charges in your Stripe **test** account. This is handy for demo environments where you want dashboards to light up immediately.

## Setup

```bash
cp .env.example .env
# edit .env and drop in your Stripe **test** secret key (sk_test_...)
npm install
```

## Usage

```bash
npm run seed
```

The script creates:

- Product: `BlackRoad PRISM`
- Prices: monthly $49 and yearly $490
- Customers: Alice and Bob Example
- Subscriptions: Alice trialing (3 seats monthly), Bob active (yearly)
- Charges: three one-off charges using the `tok_visa` test token

It prints identifiers for the created objects and will automatically trigger Stripe webhooks if you have your endpoint connected.

## Notes

- Only test-mode resources are created.
- Set `CURRENCY` in `.env` if you want something other than USD.
- Re-running the seed will create new objects each time; clean up in the Stripe dashboard if desired.
