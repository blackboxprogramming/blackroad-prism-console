# AutoPal FastAPI Stack

This docker-compose stack launches the AutoPal API, a mock OIDC issuer, and Redis
for distributed rate limiting.

## Services

| Service       | Port | Description |
| ------------- | ---- | ----------- |
| `autopal`     | 8080 | FastAPI AutoPal materialization service |
| `mock-issuer` | 8081 | FastAPI mock OIDC issuer with JWKS + token minting |
| `redis`       | 6379 | Backing store for shared rate limits |

## Usage

```bash
docker compose up --build
```

Once the stack is running:

```bash
ID=$(curl -s -X POST http://localhost:8081/token \
  -H 'Content-Type: application/json' \
  -d '{"sub":"alice","aud":"gha:org/repo@refs/heads/main","exp":3600}' | jq -r .id_token)

# First call without step-up should 401
curl -i -X POST http://localhost:8080/secrets/materialize \
  -H "Authorization: Bearer $ID" \
  -H "X-Audience: gha:org/repo@refs/heads/main"

# Add step-up header to succeed
curl -i -X POST http://localhost:8080/secrets/materialize \
  -H "Authorization: Bearer $ID" \
  -H "X-Audience: gha:org/repo@refs/heads/main" \
  -H "X-Step-Up-Approved: true"
```

The Redis-backed limiter tracks requests per subject and audience. When the
configured burst is exceeded the API returns `429 Too Many Requests` with a
`Retry-After` header indicating when the bucket refills.
