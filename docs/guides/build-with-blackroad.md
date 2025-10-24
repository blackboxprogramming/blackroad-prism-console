# Build with BlackRoad — Public API Quickstart

Welcome to the BlackRoad developer platform. This guide walks you through provisioning API keys, making your first request, validating webhook signatures, and using the official SDKs.

## 1. Create an Account and Workspace

1. Visit [developers.blackroad.io](https://developers.blackroad.io) and sign in with your BlackRoad ID.
2. Create a sandbox workspace. Each workspace is isolated with sample services, caption media, and simulation profiles.
3. Generate a **Personal Access Token (PAT)** for read-only experimentation.

## 2. Register an OAuth App (Optional)

1. Navigate to **Integrations → OAuth Apps**.
2. Click **New App**, provide a redirect URI, and record the Client ID.
3. Use PKCE for the Authorization Code flow. The token exchange endpoint is `https://auth.blackroad.io/oauth2/token`.

## 3. Obtain Service Token

Service tokens are recommended for server-to-server integrations.

```bash
curl -X POST https://auth.blackroad.io/service-tokens \
  -H "Authorization: Bearer <admin PAT>" \
  -H "Content-Type: application/json" \
  -d '{"name":"docs quickstart token","scopes":["deploy:write","media:write","sim:write"]}'
```

Store the response `token` securely — it cannot be retrieved again.

## 4. First Deploy Request

```bash
curl -X POST https://sandbox.api.blackroad.io/v1/deploys \
  -H "Authorization: Bearer $SERVICE_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "svc-demo",
    "environment": "staging",
    "gitRef": "1a2b3c4",
    "metadata": {"source": "quickstart"}
  }'
```

Response:

```json
{
  "releaseId": "rel_123",
  "status": "pending",
  "auditId": "audit_789"
}
```

## 5. SDK Usage

### JavaScript (TypeScript)

```ts
import { BlackRoadClient } from '@blackroad/public-api';

const client = new BlackRoadClient({
  baseUrl: 'https://sandbox.api.blackroad.io',
  token: process.env.BLACKROAD_TOKEN,
});

const deploy = await client.deploys.create({
  serviceId: 'svc-demo',
  environment: 'staging',
  gitRef: '1a2b3c4',
});
console.log(deploy.releaseId);
```

### Python

```python
from blackroad import BlackRoadClient

client = BlackRoadClient(
    base_url="https://sandbox.api.blackroad.io",
    token=os.environ["BLACKROAD_TOKEN"],
)

job = client.captions.create(
    asset_url="https://cdn.blackroad.io/demo.mp4",
    source_language="en",
    target_languages=["es", "fr"],
)
print(job["jobId"])
```

## 6. Verify Webhook Signatures

```ts
import { verifySignature } from '@blackroad/public-api/webhooks';

const signatureValid = verifySignature({
  signature: req.headers['x-blackroad-signature'],
  timestamp: req.headers['x-blackroad-timestamp'],
  secret: process.env.BLACKROAD_WEBHOOK_SECRET!,
  body: JSON.stringify(req.body),
});
```

If verification fails, respond with HTTP 400 to trigger a retry.

## 7. Monitor Usage

- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Audit logs available in the developer portal under **Activity**.
- Observability metrics accessible via the Insights tab (powered by OpenTelemetry).

Happy building! Tag #blackroad-builders to showcase what you ship.
