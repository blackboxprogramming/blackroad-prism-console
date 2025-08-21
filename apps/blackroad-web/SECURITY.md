# Security

This UI enforces a strict Content-Security-Policy:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.blackroad.io wss://api.blackroad.io; img-src 'self' data:; frame-ancestors 'none'
```

TypeScript is configured with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes` for safer code. Secrets are injected at build time via environment variables and `.env` files are never committed.
