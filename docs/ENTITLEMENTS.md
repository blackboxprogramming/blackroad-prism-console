# Entitlements
- Plan → features mapping resolved by `apps/api/src/lib/entitlements.ts`.
- Gate an endpoint: `app.get('/x', requireEntitlement('feature'), handler)`.
